import type { Metadata } from "next";
import Link from "next/link";
import { btn, inputCls, PageHeader, StatusChip } from "@/components/ui";
import type { TaskStatus, TaskType } from "@/db/schema";
import { isOwner } from "@/lib/auth";
import { formatHours, formatRange, isValidMonthKey, monthKey, monthLabel } from "@/lib/dates";
import { STATUS, STATUS_ORDER, TYPE, TYPE_VALUES } from "@/lib/labels";
import { listTasks, scopeOptions } from "@/lib/queries";

export const metadata: Metadata = { title: "Tugas" };

type Search = Promise<{ status?: string; jenis?: string; lingkup?: string; bulan?: string; q?: string }>;

export default async function TasksPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const status = STATUS_ORDER.includes(sp.status as TaskStatus) ? (sp.status as TaskStatus) : undefined;
  const type = TYPE_VALUES.includes(sp.jenis as TaskType) ? (sp.jenis as TaskType) : undefined;
  const scopeId = sp.lingkup && /^\d+$/.test(sp.lingkup) ? Number(sp.lingkup) : undefined;
  const month = isValidMonthKey(sp.bulan) ? sp.bulan : undefined;
  const q = sp.q?.trim().slice(0, 100) || undefined;

  const [rows, scopes, owner] = await Promise.all([
    listTasks({ status, type, scopeId, monthKey: month, q }),
    scopeOptions(),
    isOwner(),
  ]);

  const months = [...new Set(scopes.map((s) => monthKey(s.month)))];
  const filtered = !!(status || type || scopeId || month || q);

  return (
    <>
      <PageHeader
        title="Tugas"
        subtitle={`${rows.length} tugas${filtered ? " sesuai filter" : ""}`}
        actions={
          owner ? (
            <Link href="/tugas/baru" className={btn.secondary}>
              + Tugas baru
            </Link>
          ) : null
        }
      />

      <form method="get" className="mb-5 grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr_1fr_auto]">
        <label className="sr-only" htmlFor="f-q">Cari</label>
        <input id="f-q" name="q" defaultValue={q} placeholder="Cari judul atau deskripsi" className={inputCls} />
        <label className="sr-only" htmlFor="f-status">Status</label>
        <select id="f-status" name="status" defaultValue={status ?? ""} className={inputCls}>
          <option value="">Semua status</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS[s].label}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="f-jenis">Jenis</label>
        <select id="f-jenis" name="jenis" defaultValue={type ?? ""} className={inputCls}>
          <option value="">Semua jenis</option>
          {TYPE_VALUES.map((t) => (
            <option key={t} value={t}>{TYPE[t]}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="f-lingkup">Lingkup</label>
        <select id="f-lingkup" name="lingkup" defaultValue={scopeId ?? ""} className={inputCls}>
          <option value="">Semua lingkup</option>
          {scopes.map((s) => (
            <option key={s.id} value={s.id}>{s.title} · {monthLabel(monthKey(s.month))}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="f-bulan">Bulan</label>
        <select id="f-bulan" name="bulan" defaultValue={month ?? ""} className={inputCls}>
          <option value="">Semua bulan</option>
          {month && !months.includes(month) ? <option value={month}>{monthLabel(month)}</option> : null}
          {months.map((m) => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className={btn.primary}>Terapkan</button>
          {filtered ? <Link href="/tugas" className={btn.secondary}>Reset</Link> : null}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-muted">
            {filtered ? "Tidak ada tugas yang cocok dengan filter." : "Belum ada tugas."}
          </p>
        ) : (
          <ul>
            {rows.map((t, i) => (
              <li key={t.id} className={i ? "border-t border-line-soft" : ""}>
                <Link href={`/tugas/${t.id}`} className="grid gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-ground sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="font-medium">{t.title}</div>
                    <div className="mt-0.5 text-[13px] text-muted">
                      {TYPE[t.type]}
                      {t.scopeTitle ? ` · ${t.scopeTitle}` : ""}
                      {` · ${formatRange(t.startDate, t.dueDate)}`}
                      {Number(t.hours) > 0 ? ` · ${formatHours(t.hours)} jam` : ""}
                    </div>
                  </div>
                  <div>
                    <StatusChip status={t.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
