import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addComment,
  addTimeLog,
  changeStatus,
  deleteAttachment,
  deleteComment,
  deleteTask,
  deleteTimeLog,
  setCommentHidden,
  uploadAttachment,
} from "@/app/actions";
import { ConfirmAction, SubmitButton } from "@/components/form-bits";
import { CommentForm, TimeLogForm, UploadForm } from "@/components/forms";
import { btn, Card, CardTitle, cx, Empty, inputCls, Prose, StatusChip } from "@/components/ui";
import { isOwner } from "@/lib/auth";
import {
  diffDays,
  formatDate,
  formatDateShort,
  formatDateTime,
  formatHours,
  monthKey,
  monthLabel,
  timeAgo,
  toDateStr,
  todayStr,
} from "@/lib/dates";
import { PRIORITY, STATUS, STATUS_ORDER, TYPE } from "@/lib/labels";
import { getTask } from "@/lib/queries";
import { storageEnabled } from "@/lib/storage";

type Params = Promise<{ id: string }>;

async function load(id: string) {
  if (!/^\d+$/.test(id)) return null;
  const owner = await isOwner();
  const data = await getTask(Number(id), owner);
  return data ? { data, owner } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const res = await load(id);
  return { title: res?.data.task.title ?? "Tugas" };
}

export default async function TaskPage({ params }: { params: Params }) {
  const { id } = await params;
  const res = await load(id);
  if (!res) notFound();
  const { data, owner } = res;
  const t = data.task;
  const today = todayStr();
  const waitingDays = t.status === "waiting" && data.waitingSince ? diffDays(toDateStr(new Date(data.waitingSince)), today) : null;
  const overdue = t.dueDate && t.status !== "done" && t.dueDate < today;

  return (
    <>
      <div className="mb-6">
        <Link href="/tugas" className="text-[13px] text-muted hover:text-ink">
          ← Semua tugas
        </Link>
      </div>

      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{t.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <StatusChip status={t.status} />
            <span>{TYPE[t.type]}</span>
            <span aria-hidden="true">·</span>
            <span>Prioritas {PRIORITY[t.priority].toLowerCase()}</span>
          </div>
        </div>
        {owner ? (
          <div className="flex flex-wrap items-center gap-2">
            <form action={changeStatus.bind(null, t.id)} className="flex items-center gap-2">
              <label htmlFor="quick-status" className="sr-only">Ubah status</label>
              <select id="quick-status" name="status" defaultValue={t.status} className={cx(inputCls, "h-10 w-auto py-0")}>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{STATUS[s].label}</option>
                ))}
              </select>
              <SubmitButton variant="secondary" pendingText="…">Ubah status</SubmitButton>
            </form>
            <Link href={`/tugas/${t.id}/ubah`} className={btn.primary}>Ubah</Link>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          {t.status === "waiting" ? (
            <div className="rounded-xl border-[1.5px] border-dashed border-amber-600 bg-amber-50/50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">Menunggu {t.waitingOn || "—"}</div>
                {waitingDays !== null ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                    sejak {waitingDays} hari lalu
                  </span>
                ) : null}
              </div>
              {t.waitingReason ? <p className="mt-1">{t.waitingReason}</p> : null}
            </div>
          ) : null}

          <Card>
            <CardTitle>Deskripsi</CardTitle>
            {t.description ? <Prose text={t.description} /> : <p className="text-muted">Tidak ada deskripsi.</p>}
          </Card>

          {t.type === "research" ? (
            <Card>
              <CardTitle>Riset</CardTitle>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-[13px] font-medium text-muted">Pertanyaan</div>
                  {t.researchQuestion ? <Prose text={t.researchQuestion} /> : <p className="text-muted">—</p>}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-muted">Temuan / kesimpulan</div>
                  {t.researchFinding ? <Prose text={t.researchFinding} /> : <p className="text-muted">Belum ada temuan.</p>}
                </div>
              </div>
            </Card>
          ) : null}

          {t.impactNote ? (
            <Card>
              <CardTitle>Catatan dampak</CardTitle>
              <Prose text={t.impactNote} />
            </Card>
          ) : null}

          <Card>
            <CardTitle action={<span className="text-[13px] text-muted">Total {formatHours(data.totalHours)} jam</span>}>
              Jam kerja
            </CardTitle>
            {data.logs.length === 0 ? (
              <Empty>Belum ada jam tercatat.</Empty>
            ) : (
              <ul>
                {data.logs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 border-t border-line-soft py-2.5">
                    <div className="min-w-0">
                      <span className="font-medium">{formatHours(l.hours)} jam</span>
                      <span className="text-muted"> · {formatDate(l.date)}</span>
                      {l.note ? <div className="text-[13px] text-muted">{l.note}</div> : null}
                    </div>
                    {owner ? (
                      <ConfirmAction action={deleteTimeLog.bind(null, l.id)} message="Hapus catatan jam ini?">
                        Hapus
                      </ConfirmAction>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {owner ? <TimeLogForm action={addTimeLog.bind(null, t.id)} today={today} /> : null}
          </Card>

          {data.files.length > 0 || (owner && storageEnabled()) ? (
            <Card>
              <CardTitle>Tangkapan layar</CardTitle>
              {data.files.length === 0 ? (
                <Empty>Belum ada gambar.</Empty>
              ) : (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {data.files.map((f) => (
                    <figure key={f.id} className="flex flex-col gap-2">
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-line">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.url} alt={f.caption || `Gambar untuk ${t.title}`} loading="lazy" className="aspect-video w-full object-cover" />
                      </a>
                      <figcaption className="flex items-start justify-between gap-2 text-[13px] text-muted">
                        <span>{f.caption}</span>
                        {owner ? (
                          <ConfirmAction action={deleteAttachment.bind(null, f.id)} message="Hapus gambar ini?">
                            Hapus
                          </ConfirmAction>
                        ) : null}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
              {owner && storageEnabled() ? <UploadForm action={uploadAttachment.bind(null, t.id)} /> : null}
            </Card>
          ) : null}

          <Card>
            <div id="komentar" className="scroll-mt-6" />
            <CardTitle>Komentar</CardTitle>
            {data.comments.length === 0 ? (
              <p className="pb-2 text-muted">Belum ada komentar. Ada masukan? Tulis di bawah.</p>
            ) : (
              <ul>
                {data.comments.map((c) => (
                  <li key={c.id} className={cx("border-t border-line-soft py-3.5", c.hidden && "opacity-60")}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[13px] text-muted">
                        {c.isOwner ? (
                          <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">Pengembang</span>
                        ) : (
                          <span className="font-medium text-ink">{c.authorName}</span>
                        )}
                        <span title={formatDateTime(new Date(c.createdAt))}> · {timeAgo(new Date(c.createdAt))}</span>
                        {c.hidden ? <span className="ml-1.5 text-red-700">· disembunyikan</span> : null}
                      </div>
                      {owner ? (
                        <div className="flex gap-1">
                          <form action={setCommentHidden.bind(null, c.id, !c.hidden)}>
                            <SubmitButton variant="small" pendingText="…">{c.hidden ? "Tampilkan" : "Sembunyikan"}</SubmitButton>
                          </form>
                          <ConfirmAction action={deleteComment.bind(null, c.id)} message="Hapus komentar ini secara permanen?">
                            Hapus
                          </ConfirmAction>
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-1 whitespace-pre-line break-words">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <CommentForm action={addComment.bind(null, t.id)} owner={owner} />
          </Card>
        </div>

        <aside className="flex flex-col gap-5">
          <Card>
            <CardTitle>Detail</CardTitle>
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5 text-[13px]">
              <dt className="text-muted">Lingkup</dt>
              <dd>
                {t.scopeId && data.scopeTitle ? (
                  <Link href={`/tugas?lingkup=${t.scopeId}`} className="hover:text-accent">
                    {data.scopeTitle}
                    {data.scopeMonth ? <span className="text-muted"> · {monthLabel(monthKey(data.scopeMonth))}</span> : null}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
              <dt className="text-muted">Mulai</dt>
              <dd>{formatDate(t.startDate)}</dd>
              <dt className="text-muted">Tenggat</dt>
              <dd className={overdue ? "font-medium text-red-700" : undefined}>
                {formatDate(t.dueDate)}
                {overdue ? " · lewat" : ""}
              </dd>
              {t.completedAt ? (
                <>
                  <dt className="text-muted">Selesai</dt>
                  <dd>{formatDate(toDateStr(new Date(t.completedAt)))}</dd>
                </>
              ) : null}
              <dt className="text-muted">Jam kerja</dt>
              <dd>{formatHours(data.totalHours)} jam</dd>
              <dt className="text-muted">Dibuat</dt>
              <dd>{formatDate(toDateStr(new Date(t.createdAt)))}</dd>
            </dl>
          </Card>

          <Card>
            <CardTitle>Riwayat status</CardTitle>
            {data.history.length === 0 ? (
              <Empty>—</Empty>
            ) : (
              <ol className="flex flex-col gap-3 text-[13px]">
                {data.history.map((h) => (
                  <li key={h.id} className="flex items-start gap-2.5">
                    <span aria-hidden="true" className={cx("mt-1.5 size-2 shrink-0 rounded-full", STATUS[h.toStatus].dot)} />
                    <div>
                      <div>
                        {h.fromStatus ? (
                          <>
                            <span className="text-muted">{STATUS[h.fromStatus].label} →</span> {STATUS[h.toStatus].label}
                          </>
                        ) : (
                          <>Dibuat sebagai {STATUS[h.toStatus].label.toLowerCase()}</>
                        )}
                      </div>
                      <div className="text-muted">{formatDateTime(new Date(h.changedAt))}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {data.notes.length > 0 ? (
            <Card>
              <CardTitle>Catatan terkait</CardTitle>
              <ul className="flex flex-col gap-2 text-[13px]">
                {data.notes.map((n) => (
                  <li key={n.id}>
                    <Link href={`/catatan#catatan-${n.id}`} className="hover:text-accent">
                      <span className="font-medium">{n.title}</span>
                      <span className="text-muted"> · {formatDateShort(n.date)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {owner ? (
            <div className="flex justify-end">
              <ConfirmAction action={deleteTask.bind(null, t.id)} message="Hapus tugas ini beserta jam kerja, komentar dan gambarnya? Tindakan ini tidak bisa dibatalkan.">
                Hapus tugas
              </ConfirmAction>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}
