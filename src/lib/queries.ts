import "server-only";
import { and, asc, desc, eq, gte, ilike, isNotNull, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  attachments,
  comments,
  monthlyScopes,
  notes,
  statusHistory,
  tasks,
  timeLogs,
  type TaskStatus,
  type TaskType,
} from "@/db/schema";
import { firstOfMonth, lastOfMonth, toDateStr } from "./dates";

/** Total hours logged per task (aliases keep the outer "tasks" reference unambiguous) */
const hoursSq = sql<string>`coalesce((select sum(tl.hours) from time_logs tl where tl.task_id = "tasks"."id"), 0)`;

/** When the task most recently entered "waiting" */
const waitingSinceSq = sql<Date | null>`(select max(sh.changed_at) from status_history sh where sh.task_id = "tasks"."id" and sh.to_status = 'waiting')`;

const taskListFields = {
  id: tasks.id,
  title: tasks.title,
  type: tasks.type,
  status: tasks.status,
  priority: tasks.priority,
  startDate: tasks.startDate,
  dueDate: tasks.dueDate,
  completedAt: tasks.completedAt,
  waitingOn: tasks.waitingOn,
  waitingReason: tasks.waitingReason,
  scopeId: tasks.scopeId,
  scopeTitle: monthlyScopes.title,
  scopeMonth: monthlyScopes.month,
  updatedAt: tasks.updatedAt,
  hours: hoursSq.as("hours"),
};

export type TaskListItem = Awaited<ReturnType<typeof listTasks>>[number];

// ---------------------------------------------------------------- overview

export async function getOverview(monthKey: string) {
  const from = firstOfMonth(monthKey);
  const to = lastOfMonth(monthKey);

  const [statusCounts, doneThisMonth, hoursThisMonth, scopes, inProgress, waiting, recentDone, recentComments] =
    await Promise.all([
      db
        .select({ status: tasks.status, count: sql<number>`count(*)::int` })
        .from(tasks)
        .groupBy(tasks.status),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(tasks)
        .where(
          and(
            eq(tasks.status, "done"),
            sql`(${tasks.completedAt} at time zone 'Asia/Jakarta')::date between ${from} and ${to}`,
          ),
        ),
      db
        .select({ total: sql<string>`coalesce(sum(${timeLogs.hours}), 0)` })
        .from(timeLogs)
        .where(and(gte(timeLogs.date, from), lte(timeLogs.date, to))),
      listScopes(monthKey),
      db
        .select(taskListFields)
        .from(tasks)
        .leftJoin(monthlyScopes, eq(tasks.scopeId, monthlyScopes.id))
        .where(eq(tasks.status, "in_progress"))
        .orderBy(sql`${tasks.dueDate} asc nulls last`, asc(tasks.id)),
      db
        .select({ ...taskListFields, waitingSince: waitingSinceSq.as("waiting_since") })
        .from(tasks)
        .leftJoin(monthlyScopes, eq(tasks.scopeId, monthlyScopes.id))
        .where(eq(tasks.status, "waiting"))
        .orderBy(sql`waiting_since asc nulls last`),
      db
        .select(taskListFields)
        .from(tasks)
        .leftJoin(monthlyScopes, eq(tasks.scopeId, monthlyScopes.id))
        .where(eq(tasks.status, "done"))
        .orderBy(sql`${tasks.completedAt} desc nulls last`)
        .limit(5),
      db
        .select({
          id: comments.id,
          authorName: comments.authorName,
          body: comments.body,
          isOwner: comments.isOwner,
          createdAt: comments.createdAt,
          taskId: comments.taskId,
          taskTitle: tasks.title,
        })
        .from(comments)
        .innerJoin(tasks, eq(comments.taskId, tasks.id))
        .where(eq(comments.hidden, false))
        .orderBy(desc(comments.createdAt))
        .limit(4),
    ]);

  const count = (s: TaskStatus) => statusCounts.find((c) => c.status === s)?.count ?? 0;

  return {
    stats: {
      inProgress: count("in_progress"),
      waiting: count("waiting"),
      doneThisMonth: doneThisMonth[0]?.count ?? 0,
      hoursThisMonth: Number(hoursThisMonth[0]?.total ?? 0),
    },
    scopes,
    inProgress,
    waiting,
    recentDone,
    recentComments,
  };
}

// ---------------------------------------------------------------- scopes

export async function listScopes(monthKey: string) {
  return db
    .select({
      id: monthlyScopes.id,
      month: monthlyScopes.month,
      title: monthlyScopes.title,
      description: monthlyScopes.description,
      sortOrder: monthlyScopes.sortOrder,
      total: sql<number>`(select count(*)::int from tasks t where t.scope_id = "monthly_scopes"."id")`,
      done: sql<number>`(select count(*)::int from tasks t where t.scope_id = "monthly_scopes"."id" and t.status = 'done')`,
    })
    .from(monthlyScopes)
    .where(eq(monthlyScopes.month, firstOfMonth(monthKey)))
    .orderBy(asc(monthlyScopes.sortOrder), asc(monthlyScopes.id));
}

/** Scopes for <select> inputs, newest month first */
export async function scopeOptions() {
  return db
    .select({ id: monthlyScopes.id, title: monthlyScopes.title, month: monthlyScopes.month })
    .from(monthlyScopes)
    .orderBy(desc(monthlyScopes.month), asc(monthlyScopes.sortOrder), asc(monthlyScopes.id));
}

export async function getScope(id: number) {
  const [row] = await db.select().from(monthlyScopes).where(eq(monthlyScopes.id, id));
  return row ?? null;
}

// ---------------------------------------------------------------- tasks

export type TaskFilters = {
  status?: TaskStatus;
  type?: TaskType;
  scopeId?: number;
  monthKey?: string;
  q?: string;
};

export async function listTasks(f: TaskFilters = {}) {
  const where: SQL[] = [];
  if (f.status) where.push(eq(tasks.status, f.status));
  if (f.type) where.push(eq(tasks.type, f.type));
  if (f.scopeId) where.push(eq(tasks.scopeId, f.scopeId));
  if (f.q) {
    const term = `%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    where.push(or(ilike(tasks.title, term), ilike(tasks.description, term))!);
  }
  if (f.monthKey) {
    const from = firstOfMonth(f.monthKey);
    const to = lastOfMonth(f.monthKey);
    // in this month's scope, or its dates overlap the month, or it was finished in the month
    where.push(
      or(
        eq(monthlyScopes.month, from),
        and(
          sql`coalesce(${tasks.startDate}, ${tasks.dueDate}) <= ${to}`,
          sql`coalesce(${tasks.dueDate}, ${tasks.startDate}) >= ${from}`,
        ),
        sql`(${tasks.completedAt} at time zone 'Asia/Jakarta')::date between ${from} and ${to}`,
      )!,
    );
  }

  return db
    .select(taskListFields)
    .from(tasks)
    .leftJoin(monthlyScopes, eq(tasks.scopeId, monthlyScopes.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(
      sql`case ${tasks.status} when 'in_progress' then 0 when 'waiting' then 1 when 'planned' then 2 when 'backlog' then 3 else 4 end`,
      sql`${tasks.dueDate} asc nulls last`,
      desc(tasks.updatedAt),
    );
}

export async function getTask(id: number, includeHidden: boolean) {
  const [row] = await db
    .select({
      task: tasks,
      scopeTitle: monthlyScopes.title,
      scopeMonth: monthlyScopes.month,
      waitingSince: waitingSinceSq,
    })
    .from(tasks)
    .leftJoin(monthlyScopes, eq(tasks.scopeId, monthlyScopes.id))
    .where(eq(tasks.id, id));
  if (!row) return null;

  const [logs, files, commentRows, history, linkedNotes] = await Promise.all([
    db.select().from(timeLogs).where(eq(timeLogs.taskId, id)).orderBy(desc(timeLogs.date), desc(timeLogs.id)),
    db.select().from(attachments).where(eq(attachments.taskId, id)).orderBy(asc(attachments.id)),
    db
      .select()
      .from(comments)
      .where(includeHidden ? eq(comments.taskId, id) : and(eq(comments.taskId, id), eq(comments.hidden, false)))
      .orderBy(asc(comments.createdAt)),
    db.select().from(statusHistory).where(eq(statusHistory.taskId, id)).orderBy(desc(statusHistory.changedAt)),
    db.select().from(notes).where(eq(notes.taskId, id)).orderBy(desc(notes.date)),
  ]);

  const totalHours = logs.reduce((sum, l) => sum + Number(l.hours), 0);
  return { ...row, logs, files, comments: commentRows, history, notes: linkedNotes, totalHours };
}

export async function taskOptions() {
  return db
    .select({ id: tasks.id, title: tasks.title })
    .from(tasks)
    .orderBy(desc(tasks.updatedAt))
    .limit(200);
}

// ---------------------------------------------------------------- timeline

export type TimelineBar = {
  id: number;
  title: string;
  status: TaskStatus;
  start: string;
  end: string;
  /** true when the end date is inferred (no due date) */
  openEnded: boolean;
};

export async function getTimeline(from: string, to: string, today: string) {
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      startDate: tasks.startDate,
      dueDate: tasks.dueDate,
      completedAt: tasks.completedAt,
      scopeId: tasks.scopeId,
      scopeTitle: monthlyScopes.title,
      scopeMonth: monthlyScopes.month,
      scopeOrder: monthlyScopes.sortOrder,
    })
    .from(tasks)
    .leftJoin(monthlyScopes, eq(tasks.scopeId, monthlyScopes.id))
    .where(or(isNotNull(tasks.startDate), isNotNull(tasks.dueDate)))
    .orderBy(asc(monthlyScopes.month), asc(monthlyScopes.sortOrder), asc(monthlyScopes.id), sql`coalesce(${tasks.startDate}, ${tasks.dueDate})`, asc(tasks.id));

  type Group = { key: string; title: string; month: string | null; bars: TimelineBar[] };
  const groups = new Map<string, Group>();

  for (const r of rows) {
    const start = (r.startDate ?? r.dueDate)!;
    let end = r.dueDate;
    let openEnded = false;
    if (!end) {
      openEnded = true;
      if (r.status === "done" && r.completedAt) end = toDateStr(r.completedAt);
      else if (r.status === "in_progress" || r.status === "waiting") end = today > start ? today : start;
      else end = start;
    }
    if (end < start) end = start;
    if (end < from || start > to) continue;

    const key = r.scopeId ? `s${r.scopeId}` : "none";
    if (!groups.has(key)) {
      groups.set(key, { key, title: r.scopeTitle ?? "Tanpa lingkup", month: r.scopeMonth, bars: [] });
    }
    groups.get(key)!.bars.push({ id: r.id, title: r.title, status: r.status, start, end, openEnded });
  }

  // "Tanpa lingkup" last
  return [...groups.values()].sort((a, b) => (a.key === "none" ? 1 : b.key === "none" ? -1 : 0));
}

// ---------------------------------------------------------------- notes

export async function listNotes() {
  return db
    .select({
      id: notes.id,
      date: notes.date,
      title: notes.title,
      body: notes.body,
      taskId: notes.taskId,
      taskTitle: tasks.title,
    })
    .from(notes)
    .leftJoin(tasks, eq(notes.taskId, tasks.id))
    .orderBy(desc(notes.date), desc(notes.id));
}

export async function getNote(id: number) {
  const [row] = await db.select().from(notes).where(eq(notes.id, id));
  return row ?? null;
}

// ---------------------------------------------------------------- hours

export async function hoursByMonth(monthKey: string) {
  const from = firstOfMonth(monthKey);
  const to = lastOfMonth(monthKey);
  return db
    .select({
      id: timeLogs.id,
      date: timeLogs.date,
      hours: timeLogs.hours,
      note: timeLogs.note,
      taskId: timeLogs.taskId,
      taskTitle: tasks.title,
      taskType: tasks.type,
    })
    .from(timeLogs)
    .innerJoin(tasks, eq(timeLogs.taskId, tasks.id))
    .where(and(gte(timeLogs.date, from), lte(timeLogs.date, to)))
    .orderBy(desc(timeLogs.date), desc(timeLogs.id));
}
