import Link from "next/link";
import { Card, CardTitle, Empty, PageHeader } from "@/components/ui";
import { isOwner } from "@/lib/auth";
import { diffDays, formatDateShort, formatHours, monthKey, monthLabel, timeAgo, toDateStr, todayStr } from "@/lib/dates";
import { TYPE } from "@/lib/labels";
import { getOverview } from "@/lib/queries";

export default async function OverviewPage() {
  const today = todayStr();
  const month = monthKey(today);
  const owner = await isOwner();
  const data = await getOverview(month);

  const stats = [
    { label: "Sedang dikerjakan", value: String(data.stats.inProgress), dot: "bg-blue-600" },
    { label: "Menunggu", value: String(data.stats.waiting), dot: "bg-amber-600" },
    { label: "Selesai bulan ini", value: String(data.stats.doneThisMonth), dot: "bg-green-700" },
    { label: "Jam kerja bulan ini", value: formatHours(data.stats.hoursThisMonth), dot: "bg-accent" },
  ];

  return (
    <>
      <PageHeader title="Ringkasan" subtitle={`${monthLabel(month)} · Hari ini ${formatDateShort(today)}`} />

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-line bg-surface px-5 py-4">
              <div className="flex items-center gap-2 text-[13px] text-muted">
                <span aria-hidden="true" className={`size-2 rounded-full ${s.dot}`} />
                {s.label}
              </div>
              <div className="mt-1.5 text-[30px] font-semibold leading-tight tracking-tight">{s.value}</div>
            </div>
          ))}
        </div>

        <Card>
          <CardTitle
            action={
              owner ? (
                <Link href={`/lingkup?bulan=${month}`} className="text-[13px] text-muted hover:text-ink">
                  Kelola lingkup
                </Link>
              ) : null
            }
          >
            Lingkup {monthLabel(month)}
          </CardTitle>
          {data.scopes.length === 0 ? (
            <Empty>Belum ada lingkup kerja untuk bulan ini.</Empty>
          ) : (
            <div className="mt-4 flex flex-col gap-5">
              {data.scopes.map((s) => {
                const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
                return (
                  <Link key={s.id} href={`/tugas?lingkup=${s.id}`} className="group block">
                    <div className="mb-2 flex flex-wrap justify-between gap-2">
                      <span className="font-medium group-hover:text-accent">{s.title}</span>
                      <span className="text-[13px] text-muted">
                        {s.done} dari {s.total} selesai
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-line-soft"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={s.title}
                    >
                      <div className="h-1.5 rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardTitle dot="in_progress">Sedang dikerjakan</CardTitle>
            {data.inProgress.length === 0 ? (
              <Empty>Tidak ada tugas yang sedang dikerjakan.</Empty>
            ) : (
              data.inProgress.map((t) => (
                <Link key={t.id} href={`/tugas/${t.id}`} className="block border-t border-line-soft py-3.5 hover:text-accent">
                  <div className="font-medium">{t.title}</div>
                  <div className="mt-0.5 text-[13px] text-muted">
                    {TYPE[t.type]}
                    {t.dueDate ? ` · Tenggat ${formatDateShort(t.dueDate)}` : ""}
                    {Number(t.hours) > 0 ? ` · ${formatHours(t.hours)} jam` : ""}
                  </div>
                </Link>
              ))
            )}
          </Card>

          <Card>
            <CardTitle dot="waiting">Menunggu</CardTitle>
            {data.waiting.length === 0 ? (
              <Empty>Tidak ada tugas yang tertahan.</Empty>
            ) : (
              data.waiting.map((t) => {
                const since = t.waitingSince ? new Date(t.waitingSince) : null;
                const days = since ? Math.max(0, diffDays(toDateStr(since), today)) : null;
                return (
                  <Link key={t.id} href={`/tugas/${t.id}`} className="flex items-start justify-between gap-3 border-t border-line-soft py-3.5 hover:text-accent">
                    <div className="min-w-0">
                      <div className="font-medium">{t.title}</div>
                      <div className="mt-0.5 text-[13px] text-muted">
                        Menunggu {t.waitingOn || "—"}
                        {t.waitingReason ? `: ${t.waitingReason}` : ""}
                      </div>
                    </div>
                    {days !== null ? (
                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
                        {days} hari
                      </span>
                    ) : null}
                  </Link>
                );
              })
            )}
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardTitle dot="done">Baru selesai</CardTitle>
            {data.recentDone.length === 0 ? (
              <Empty>Belum ada tugas selesai.</Empty>
            ) : (
              data.recentDone.map((t) => (
                <Link key={t.id} href={`/tugas/${t.id}`} className="flex justify-between gap-3 border-t border-line-soft py-3.5 hover:text-accent">
                  <span className="font-medium">{t.title}</span>
                  <span className="shrink-0 text-[13px] text-muted">
                    {t.completedAt ? formatDateShort(toDateStr(new Date(t.completedAt))) : ""}
                  </span>
                </Link>
              ))
            )}
          </Card>

          <Card>
            <CardTitle>Komentar terbaru</CardTitle>
            {data.recentComments.length === 0 ? (
              <Empty>Belum ada komentar.</Empty>
            ) : (
              data.recentComments.map((c) => (
                <Link key={c.id} href={`/tugas/${c.taskId}#komentar`} className="block border-t border-line-soft py-3.5">
                  <div className="text-[13px] text-muted">
                    <span className="font-medium text-ink">{c.authorName}</span> pada {c.taskTitle} · {timeAgo(new Date(c.createdAt))}
                  </div>
                  <p className="mt-1 line-clamp-2">{c.body}</p>
                </Link>
              ))
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

