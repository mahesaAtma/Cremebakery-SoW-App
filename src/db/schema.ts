import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  date,
  timestamp,
  numeric,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const taskStatus = pgEnum("task_status", [
  "backlog",
  "planned",
  "in_progress",
  "waiting",
  "done",
]);

export const taskType = pgEnum("task_type", [
  "feature",
  "maintenance",
  "bug",
  "research",
]);

export const taskPriority = pgEnum("task_priority", ["low", "medium", "high"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** A goal / scope item for one month, e.g. "Checkout online lebih cepat" in Oct 2026. */
export const monthlyScopes = pgTable(
  "monthly_scopes",
  {
    id: serial("id").primaryKey(),
    /** First day of the month, e.g. 2026-10-01 */
    month: date("month", { mode: "string" }).notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("monthly_scopes_month_idx").on(t.month)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    scopeId: integer("scope_id").references(() => monthlyScopes.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    type: taskType("type").notNull().default("feature"),
    status: taskStatus("status").notNull().default("backlog"),
    priority: taskPriority("priority").notNull().default("medium"),
    startDate: date("start_date", { mode: "string" }),
    dueDate: date("due_date", { mode: "string" }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** Who the task is waiting on (e.g. "Klien", "Midtrans") — used when status = waiting */
    waitingOn: text("waiting_on").notNull().default(""),
    waitingReason: text("waiting_reason").notNull().default(""),
    /** Research tasks only */
    researchQuestion: text("research_question").notNull().default(""),
    researchFinding: text("research_finding").notNull().default(""),
    /** Free-text note about expected/observed impact */
    impactNote: text("impact_note").notNull().default(""),
    ...timestamps,
  },
  (t) => [
    index("tasks_status_idx").on(t.status),
    index("tasks_scope_idx").on(t.scopeId),
    index("tasks_dates_idx").on(t.startDate, t.dueDate),
  ],
);

/** Filled automatically whenever a task's status changes. */
export const statusHistory = pgTable(
  "status_history",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    fromStatus: taskStatus("from_status"),
    toStatus: taskStatus("to_status").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("status_history_task_idx").on(t.taskId, t.changedAt)],
);

export const timeLogs = pgTable(
  "time_logs",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    hours: numeric("hours", { precision: 5, scale: 2 }).notNull(),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("time_logs_task_idx").on(t.taskId), index("time_logs_date_idx").on(t.date)],
);

export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  /** Object path inside the storage bucket, used for deletion */
  storagePath: text("storage_path").notNull().default(""),
  caption: text("caption").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    isOwner: boolean("is_owner").notNull().default(false),
    hidden: boolean("hidden").notNull().default(false),
    /** SHA-256 of visitor IP + secret, only for rate limiting */
    ipHash: text("ip_hash").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("comments_task_idx").on(t.taskId), index("comments_ip_idx").on(t.ipHash, t.createdAt)],
);

/** Decision log / general notes */
export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("notes_date_idx").on(t.date)],
);

export type Task = typeof tasks.$inferSelect;
export type MonthlyScope = typeof monthlyScopes.$inferSelect;
export type TaskStatus = (typeof taskStatus.enumValues)[number];
export type TaskType = (typeof taskType.enumValues)[number];
export type TaskPriority = (typeof taskPriority.enumValues)[number];
