"use server";

import { createHash } from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  attachments,
  comments,
  monthlyScopes,
  notes,
  statusHistory,
  taskPriority,
  taskStatus,
  taskType,
  tasks,
  timeLogs,
} from "@/db/schema";
import { checkCredentials, createSession, destroySession, isOwner, requireOwner } from "@/lib/auth";
import { isValidDate, isValidMonthKey, todayStr } from "@/lib/dates";
import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, removeFile, storageEnabled, uploadFile } from "@/lib/storage";

export type FormState = { error?: string; ok?: boolean } | undefined;

function refresh() {
  revalidatePath("/", "layout");
}

const str = (max = 5000) => z.string().trim().max(max).default("");
const optDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || isValidDate(v), "Tanggal tidak valid")
  .nullable()
  .default(null);
const optId = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isInteger(v) && v > 0), "Pilihan tidak valid")
  .nullable()
  .default(null);

function fields(formData: FormData) {
  return Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
}

function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Data tidak valid";
}

// ------------------------------------------------------------------ auth

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!checkCredentials(username, password)) {
    // slow down guessing a little
    await new Promise((r) => setTimeout(r, 800));
    return { error: "Nama pengguna atau kata sandi salah." };
  }
  await createSession();
  refresh();
  redirect("/");
}

export async function logout() {
  await destroySession();
  refresh();
  redirect("/");
}

// ------------------------------------------------------------------ tasks

const taskSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(200),
  description: str(),
  type: z.enum(taskType.enumValues),
  status: z.enum(taskStatus.enumValues),
  priority: z.enum(taskPriority.enumValues),
  scopeId: optId,
  startDate: optDate,
  dueDate: optDate,
  waitingOn: str(120),
  waitingReason: str(1000),
  researchQuestion: str(),
  researchFinding: str(),
  impactNote: str(),
});

export async function saveTask(_: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();
  const parsed = taskSchema.safeParse(fields(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const data = parsed.data;
  if (data.startDate && data.dueDate && data.dueDate < data.startDate) {
    return { error: "Tenggat tidak boleh sebelum tanggal mulai." };
  }
  if (data.status === "waiting" && !data.waitingOn) {
    return { error: "Isi \"Menunggu siapa\" untuk tugas berstatus Menunggu." };
  }

  const idRaw = formData.get("id");
  const id = idRaw ? Number(idRaw) : null;
  let taskId: number;

  if (id) {
    const [existing] = await db.select({ status: tasks.status }).from(tasks).where(eq(tasks.id, id));
    if (!existing) return { error: "Tugas tidak ditemukan." };
    await db.transaction(async (tx) => {
      await tx
        .update(tasks)
        .set({
          ...data,
          completedAt:
            data.status === "done"
              ? existing.status === "done"
                ? undefined
                : new Date()
              : null,
        })
        .where(eq(tasks.id, id));
      if (existing.status !== data.status) {
        await tx.insert(statusHistory).values({ taskId: id, fromStatus: existing.status, toStatus: data.status });
      }
    });
    taskId = id;
  } else {
    taskId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(tasks)
        .values({ ...data, completedAt: data.status === "done" ? new Date() : null })
        .returning({ id: tasks.id });
      await tx.insert(statusHistory).values({ taskId: row.id, fromStatus: null, toStatus: data.status });
      return row.id;
    });
  }

  refresh();
  redirect(`/tugas/${taskId}`);
}

export async function changeStatus(taskId: number, formData: FormData) {
  await requireOwner();
  const status = z.enum(taskStatus.enumValues).parse(formData.get("status"));
  const [existing] = await db.select({ status: tasks.status }).from(tasks).where(eq(tasks.id, taskId));
  if (!existing || existing.status === status) return;
  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({ status, completedAt: status === "done" ? new Date() : null })
      .where(eq(tasks.id, taskId));
    await tx.insert(statusHistory).values({ taskId, fromStatus: existing.status, toStatus: status });
  });
  refresh();
}

export async function deleteTask(taskId: number) {
  await requireOwner();
  const files = await db.select({ path: attachments.storagePath }).from(attachments).where(eq(attachments.taskId, taskId));
  await db.delete(tasks).where(eq(tasks.id, taskId));
  await Promise.all(files.map((f) => removeFile(f.path).catch(() => {})));
  refresh();
  redirect("/tugas");
}

// ------------------------------------------------------------------ time logs

const timeLogSchema = z.object({
  date: z.string().refine(isValidDate, "Tanggal tidak valid"),
  hours: z
    .string()
    .trim()
    .transform((v) => Number(v.replace(",", ".")))
    .refine((n) => Number.isFinite(n) && n > 0 && n <= 24, "Jam harus antara 0 dan 24"),
  note: str(500),
});

export async function addTimeLog(taskId: number, _: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();
  const parsed = timeLogSchema.safeParse(fields(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  await db.insert(timeLogs).values({
    taskId,
    date: parsed.data.date,
    hours: parsed.data.hours.toFixed(2),
    note: parsed.data.note,
  });
  refresh();
  return { ok: true };
}

export async function deleteTimeLog(id: number) {
  await requireOwner();
  await db.delete(timeLogs).where(eq(timeLogs.id, id));
  refresh();
}

// ------------------------------------------------------------------ comments

const commentSchema = z.object({
  authorName: z.string().trim().min(1, "Nama wajib diisi").max(60, "Nama terlalu panjang"),
  body: z.string().trim().min(1, "Komentar tidak boleh kosong").max(2000, "Komentar maksimal 2000 karakter"),
});

async function visitorHash(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256")
    .update(`${ip}:${process.env.SESSION_SECRET ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

export async function addComment(taskId: number, _: FormState, formData: FormData): Promise<FormState> {
  // Spam trap: real people never see or fill this field
  if (String(formData.get("website") ?? "") !== "") return { ok: true };

  const owner = await isOwner();
  const raw = fields(formData);
  if (owner && !raw.authorName) raw.authorName = "Pengembang";
  const parsed = commentSchema.safeParse(raw);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const [task] = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, taskId));
  if (!task) return { error: "Tugas tidak ditemukan." };

  const ipHash = owner ? "" : await visitorHash();
  if (!owner) {
    const since = new Date(Date.now() - 10 * 60 * 1000);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(and(eq(comments.ipHash, ipHash), gte(comments.createdAt, since)));
    if (count >= 5) return { error: "Terlalu banyak komentar. Coba lagi beberapa menit lagi." };
  }

  await db.insert(comments).values({ taskId, ...parsed.data, isOwner: owner, ipHash });
  refresh();
  return { ok: true };
}

export async function setCommentHidden(id: number, hidden: boolean) {
  await requireOwner();
  await db.update(comments).set({ hidden }).where(eq(comments.id, id));
  refresh();
}

export async function deleteComment(id: number) {
  await requireOwner();
  await db.delete(comments).where(eq(comments.id, id));
  refresh();
}

// ------------------------------------------------------------------ attachments

export async function uploadAttachment(taskId: number, _: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();
  if (!storageEnabled()) return { error: "Penyimpanan file belum diatur." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih gambar terlebih dahulu." };
  if (!ALLOWED_TYPES.includes(file.type)) return { error: "Hanya PNG, JPG, WEBP atau GIF." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "Ukuran maksimal 4 MB." };
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 300);
  try {
    const { url, path } = await uploadFile(taskId, file);
    await db.insert(attachments).values({ taskId, url, storagePath: path, caption });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mengunggah." };
  }
  refresh();
  return { ok: true };
}

export async function deleteAttachment(id: number) {
  await requireOwner();
  const [row] = await db.delete(attachments).where(eq(attachments.id, id)).returning();
  if (row) await removeFile(row.storagePath).catch(() => {});
  refresh();
}

// ------------------------------------------------------------------ scopes

const scopeSchema = z.object({
  month: z.string().refine(isValidMonthKey, "Bulan tidak valid"),
  title: z.string().trim().min(1, "Judul wajib diisi").max(200),
  description: str(2000),
  sortOrder: z
    .string()
    .trim()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .refine((n) => Number.isInteger(n), "Urutan harus angka")
    .default(0),
});

export async function saveScope(_: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();
  const parsed = scopeSchema.safeParse(fields(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const values = { ...parsed.data, month: `${parsed.data.month}-01` };
  const id = Number(formData.get("id") ?? 0);
  if (id) await db.update(monthlyScopes).set(values).where(eq(monthlyScopes.id, id));
  else await db.insert(monthlyScopes).values(values);
  refresh();
  redirect(`/lingkup?bulan=${parsed.data.month}`);
}

export async function deleteScope(id: number) {
  await requireOwner();
  const [row] = await db.delete(monthlyScopes).where(eq(monthlyScopes.id, id)).returning();
  refresh();
  redirect(`/lingkup${row ? `?bulan=${row.month.slice(0, 7)}` : ""}`);
}

// ------------------------------------------------------------------ notes

const noteSchema = z.object({
  date: z.string().refine(isValidDate, "Tanggal tidak valid"),
  title: z.string().trim().min(1, "Judul wajib diisi").max(200),
  body: str(10000),
  taskId: optId,
});

export async function saveNote(_: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();
  const parsed = noteSchema.safeParse({ date: todayStr(), ...fields(formData) });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const id = Number(formData.get("id") ?? 0);
  if (id) await db.update(notes).set(parsed.data).where(eq(notes.id, id));
  else await db.insert(notes).values(parsed.data);
  refresh();
  redirect("/catatan");
}

export async function deleteNote(id: number) {
  await requireOwner();
  await db.delete(notes).where(eq(notes.id, id));
  refresh();
  redirect("/catatan");
}
