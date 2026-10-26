"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { login, saveNote, saveScope, type FormState } from "@/app/actions";
import { FormError, SubmitButton, submitWith } from "./form-bits";
import { btn, Field, inputCls } from "./ui";

type BoundAction = (state: FormState, formData: FormData) => Promise<FormState>;

function useResetOnSuccess(state: FormState) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return ref;
}

// ------------------------------------------------------------------ login

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form onSubmit={submitWith(action)} className="flex flex-col gap-4">
      <Field label="Nama pengguna" htmlFor="username">
        <input id="username" name="username" autoComplete="username" required className={inputCls} />
      </Field>
      <Field label="Kata sandi" htmlFor="password">
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputCls} />
      </Field>
      <FormError error={state?.error} />
      <SubmitButton pending={pending} pendingText="Memeriksa…">Masuk</SubmitButton>
    </form>
  );
}

// ------------------------------------------------------------------ time log

export function TimeLogForm({ action, today }: { action: BoundAction; today: string }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} onSubmit={submitWith(formAction)} className="flex flex-col gap-3 border-t border-line-soft pt-4">
      <div className="grid gap-3 sm:grid-cols-[150px_100px_1fr_auto] sm:items-end">
        <Field label="Tanggal" htmlFor="log-date">
          <input id="log-date" type="date" name="date" defaultValue={today} required className={inputCls} />
        </Field>
        <Field label="Jam" htmlFor="log-hours">
          <input id="log-hours" name="hours" inputMode="decimal" placeholder="1,5" required className={inputCls} />
        </Field>
        <Field label="Keterangan" htmlFor="log-note">
          <input id="log-note" name="note" maxLength={500} placeholder="opsional" className={inputCls} />
        </Field>
        <SubmitButton pending={pending} variant="secondary" pendingText="…">
          Catat jam
        </SubmitButton>
      </div>
      <FormError error={state?.error} />
    </form>
  );
}

// ------------------------------------------------------------------ comments

export function CommentForm({ action, owner }: { action: BoundAction; owner: boolean }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} onSubmit={submitWith(formAction)} className="flex flex-col gap-3 border-t border-line-soft pt-4">
      {/* spam trap: hidden from people, bots tend to fill it */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {owner ? (
        <input type="hidden" name="authorName" value="Pengembang" />
      ) : (
        <Field label="Nama" htmlFor="c-name">
          <input id="c-name" name="authorName" maxLength={60} required autoComplete="name" className={inputCls + " sm:max-w-xs"} />
        </Field>
      )}
      <Field label={owner ? "Balas sebagai pengembang" : "Komentar"} htmlFor="c-body">
        <textarea id="c-body" name="body" rows={3} maxLength={2000} required className={inputCls} />
      </Field>
      <FormError error={state?.error} />
      {state?.ok ? <p className="text-[13px] text-green-800">Komentar terkirim. Terima kasih!</p> : null}
      <div>
        <SubmitButton pending={pending} variant="secondary" pendingText="Mengirim…">
          Kirim komentar
        </SubmitButton>
      </div>
    </form>
  );
}

// ------------------------------------------------------------------ upload

export function UploadForm({ action }: { action: BoundAction }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} onSubmit={submitWith(formAction)} className="flex flex-col gap-3 border-t border-line-soft pt-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Gambar (maks. 4 MB)" htmlFor="up-file">
          <input id="up-file" type="file" name="file" accept="image/png,image/jpeg,image/webp,image/gif" required className="block w-full text-[13px] file:mr-3 file:h-9 file:cursor-pointer file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:text-ink" />
        </Field>
        <Field label="Keterangan" htmlFor="up-caption">
          <input id="up-caption" name="caption" maxLength={300} placeholder="opsional" className={inputCls} />
        </Field>
        <SubmitButton pending={pending} variant="secondary" pendingText="Mengunggah…">
          Unggah
        </SubmitButton>
      </div>
      <FormError error={state?.error} />
    </form>
  );
}

// ------------------------------------------------------------------ scope

export function ScopeForm({
  initial,
  cancelHref,
}: {
  initial: { id?: number; month: string; title: string; description: string; sortOrder: number };
  cancelHref?: string;
}) {
  const [state, action, pending] = useActionState(saveScope, undefined);
  return (
    <form onSubmit={submitWith(action)} className="flex flex-col gap-4">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-[160px_1fr_100px]">
        <Field label="Bulan" htmlFor="s-month">
          <input id="s-month" type="month" name="month" defaultValue={initial.month} required className={inputCls} />
        </Field>
        <Field label="Judul lingkup" htmlFor="s-title">
          <input id="s-title" name="title" defaultValue={initial.title} required maxLength={200} placeholder="mis. Checkout online lebih cepat" className={inputCls} />
        </Field>
        <Field label="Urutan" htmlFor="s-order">
          <input id="s-order" name="sortOrder" type="number" defaultValue={initial.sortOrder} className={inputCls} />
        </Field>
      </div>
      <Field label="Deskripsi" htmlFor="s-desc">
        <textarea id="s-desc" name="description" rows={2} defaultValue={initial.description} className={inputCls} />
      </Field>
      <FormError error={state?.error} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton pending={pending}>{initial.id ? "Simpan perubahan" : "Tambah lingkup"}</SubmitButton>
        {cancelHref ? (
          <Link href={cancelHref} className={btn.secondary}>
            Batal
          </Link>
        ) : null}
      </div>
    </form>
  );
}

// ------------------------------------------------------------------ note

export function NoteForm({
  initial,
  tasks,
  cancelHref,
}: {
  initial: { id?: number; date: string; title: string; body: string; taskId: number | null };
  tasks: { id: number; title: string }[];
  cancelHref?: string;
}) {
  const [state, action, pending] = useActionState(saveNote, undefined);
  return (
    <form onSubmit={submitWith(action)} className="flex flex-col gap-4">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <Field label="Tanggal" htmlFor="n-date">
          <input id="n-date" type="date" name="date" defaultValue={initial.date} required className={inputCls} />
        </Field>
        <Field label="Judul" htmlFor="n-title">
          <input id="n-title" name="title" defaultValue={initial.title} required maxLength={200} placeholder="mis. Pakai Midtrans, bukan Xendit" className={inputCls} />
        </Field>
      </div>
      <Field label="Isi catatan" htmlFor="n-body" hint="Untuk keputusan: apa yang dipilih, alternatifnya, dan alasannya.">
        <textarea id="n-body" name="body" rows={5} defaultValue={initial.body} className={inputCls} />
      </Field>
      <Field label="Terkait tugas (opsional)" htmlFor="n-task">
        <select id="n-task" name="taskId" defaultValue={initial.taskId ?? ""} className={inputCls}>
          <option value="">—</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </Field>
      <FormError error={state?.error} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton pending={pending}>{initial.id ? "Simpan perubahan" : "Tambah catatan"}</SubmitButton>
        {cancelHref ? (
          <Link href={cancelHref} className={btn.secondary}>
            Batal
          </Link>
        ) : null}
      </div>
    </form>
  );
}
