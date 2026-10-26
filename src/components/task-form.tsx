"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveTask } from "@/app/actions";
import type { TaskPriority, TaskStatus, TaskType } from "@/db/schema";
import { PRIORITY, PRIORITY_VALUES, STATUS, STATUS_VALUES, TYPE, TYPE_VALUES } from "@/lib/labels";
import { FormError, SubmitButton, submitWith } from "./form-bits";
import { btn, Field, inputCls } from "./ui";

export type TaskFormValues = {
  id?: number;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  scopeId: number | null;
  startDate: string | null;
  dueDate: string | null;
  waitingOn: string;
  waitingReason: string;
  researchQuestion: string;
  researchFinding: string;
  impactNote: string;
};

export function TaskForm({
  initial,
  scopes,
  cancelHref,
}: {
  initial: TaskFormValues;
  scopes: { id: number; label: string }[];
  cancelHref: string;
}) {
  const [state, action, pending] = useActionState(saveTask, undefined);
  const [status, setStatus] = useState<TaskStatus>(initial.status);
  const [type, setType] = useState<TaskType>(initial.type);

  return (
    <form onSubmit={submitWith(action)} className="flex flex-col gap-6">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6">
        <Field label="Judul" htmlFor="title">
          <input id="title" name="title" required maxLength={200} defaultValue={initial.title} className={inputCls} placeholder="mis. Integrasi QRIS di checkout" />
        </Field>

        <Field label="Deskripsi" htmlFor="description">
          <textarea id="description" name="description" rows={4} defaultValue={initial.description} className={inputCls} placeholder="Apa yang dikerjakan dan kenapa" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Status" htmlFor="status">
            <select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className={inputCls}>
              {STATUS_VALUES.map((s) => (
                <option key={s} value={s}>
                  {STATUS[s].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Jenis" htmlFor="type">
            <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as TaskType)} className={inputCls}>
              {TYPE_VALUES.map((t) => (
                <option key={t} value={t}>
                  {TYPE[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prioritas" htmlFor="priority">
            <select id="priority" name="priority" defaultValue={initial.priority} className={inputCls}>
              {PRIORITY_VALUES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY[p]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Lingkup bulanan" htmlFor="scopeId">
            <select id="scopeId" name="scopeId" defaultValue={initial.scopeId ?? ""} className={inputCls}>
              <option value="">Tanpa lingkup</option>
              {scopes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tanggal mulai" htmlFor="startDate">
            <input id="startDate" type="date" name="startDate" defaultValue={initial.startDate ?? ""} className={inputCls} />
          </Field>
          <Field label="Tenggat" htmlFor="dueDate">
            <input id="dueDate" type="date" name="dueDate" defaultValue={initial.dueDate ?? ""} className={inputCls} />
          </Field>
        </div>
      </div>

      {status === "waiting" ? (
        <div className="flex flex-col gap-5 rounded-xl border border-dashed border-amber-600 bg-amber-50/40 p-5 sm:p-6">
          <h2 className="font-semibold">Sedang menunggu</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Menunggu siapa" htmlFor="waitingOn" hint="mis. Klien, Midtrans, Desainer">
              <input id="waitingOn" name="waitingOn" maxLength={120} defaultValue={initial.waitingOn} className={inputCls} required />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Menunggu apa" htmlFor="waitingReason">
                <input id="waitingReason" name="waitingReason" maxLength={1000} defaultValue={initial.waitingReason} className={inputCls} placeholder="mis. nomor WhatsApp Business" />
              </Field>
            </div>
          </div>
        </div>
      ) : (
        <>
          <input type="hidden" name="waitingOn" value={initial.waitingOn} />
          <input type="hidden" name="waitingReason" value={initial.waitingReason} />
        </>
      )}

      {type === "research" ? (
        <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-semibold">Riset</h2>
          <Field label="Pertanyaan yang ingin dijawab" htmlFor="researchQuestion">
            <textarea id="researchQuestion" name="researchQuestion" rows={2} defaultValue={initial.researchQuestion} className={inputCls} />
          </Field>
          <Field label="Temuan / kesimpulan" htmlFor="researchFinding">
            <textarea id="researchFinding" name="researchFinding" rows={4} defaultValue={initial.researchFinding} className={inputCls} />
          </Field>
        </div>
      ) : (
        <>
          <input type="hidden" name="researchQuestion" value={initial.researchQuestion} />
          <input type="hidden" name="researchFinding" value={initial.researchFinding} />
        </>
      )}

      <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <Field label="Catatan dampak (opsional)" htmlFor="impactNote" hint="Apa yang diharapkan berubah untuk bisnis, atau apa yang terjadi setelahnya.">
          <textarea id="impactNote" name="impactNote" rows={3} defaultValue={initial.impactNote} className={inputCls} />
        </Field>
      </div>

      <FormError error={state?.error} />

      <div className="flex flex-wrap gap-2">
        <SubmitButton pending={pending}>{initial.id ? "Simpan perubahan" : "Buat tugas"}</SubmitButton>
        <Link href={cancelHref} className={btn.secondary}>
          Batal
        </Link>
      </div>
    </form>
  );
}
