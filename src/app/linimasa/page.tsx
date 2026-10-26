import type { Metadata } from "next";
import Link from "next/link";
import { cx, MonthSwitcher, PageHeader, StatusDot } from "@/components/ui";
import type { TaskStatus } from "@/db/schema";
import {
  addDays,
  addMonths,
  daysInMonth,
  diffDays,
  firstOfMonth,
  formatDateShort,
  formatRange,
  isValidDate,
  isValidMonthKey,
  lastOfMonth,
  monthKey,
  monthLabel,
  parse,
  startOfWeek,
  todayStr,
  weekday,
  weekdayShort,
} from "@/lib/dates";
import { STATUS } from "@/lib/labels";
import { getTimeline } from "@/lib/queries";

export const metadata: Metadata = { title: "Linimasa" };

type Search = Promise<{ bulan?: string; tampilan?: string; minggu?: string }>;

const LEGEND: TaskStatus[] = ["planned", "in_progress", "waiting", "done"];

export default async function TimelinePage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const today = todayStr();
  const mode = sp.tampilan === "minggu" ? "minggu" : "bulan";

  let from: string;
  let to: string;
  let label: string;
  let prevHref: string;
  let nextHref: string;
  let bulanHref: string;
  let mingguHref: string;

  if (mode === "minggu") {
    const anchor = isValidDate(sp.minggu) ? sp.minggu : today;
    from = startOfWeek(anchor);
    to = addDays(from, 6);
    label = `${formatDateShort(from)} – ${formatDateShort(to)}`;
    prevHref = `/linimasa?tampilan=minggu&minggu=${addDays(from, -7)}`;
    nextHref = `/linimasa?tampilan=minggu&minggu=${addDays(from, 7)}`;
    bulanHref = `/linimasa?bulan=${monthKey(from)}`;
    mingguHref = `/linimasa?tampilan=minggu&minggu=${from}`;
  } else {
    const key = isValidMonthKey(sp.bulan) ? sp.bulan : monthKey(today);
    from = firstOfMonth(key);
    to = lastOfMonth(key);
    label = monthLabel(key);
    prevHref = `/linimasa?bulan=${addMonths(key, -1)}`;
    nextHref = `/linimasa?bulan=${addMonths(key, 1)}`;
    bulanHref = `/linimasa?bulan=${key}`;
    const weekAnchor = monthKey(today) === key ? today : from;
    mingguHref = `/linimasa?tampilan=minggu&minggu=${startOfWeek(weekAnchor)}`;
  }

  const n = mode === "minggu" ? 7 : daysInMonth(monthKey(from));
  const days = Array.from({ length: n }, (_, i) => addDays(from, i));
  const groups = await getTimeline(from, to, today);
  const taskCount = groups.reduce((sum, g) => sum + g.bars.length, 0);

  const pct = (d: number) => `${((d / n) * 100).toFixed(4)}%`;
  const todayIdx = today >= from && today <= to ? diffDays(from, today) : null;
  const isWeekend = (d: string) => weekday(d) === 0 || weekday(d) === 6;

  return (
    <>
      <PageHeader
        title="Linimasa"
        subtitle={taskCount ? `${taskCount} tugas di ${groups.length} lingkup kerja` : "Belum ada tugas bertanggal di periode ini"}
        actions={
          <>
            <MonthSwitcher label={label} prevHref={prevHref} nextHref={nextHref} />
            <div role="group" aria-label="Rentang tampilan" className="flex gap-0.5 rounded-lg border border-line bg-surface p-[3px]">
              {[
                { id: "minggu", label: "Minggu", href: mingguHref },
                { id: "bulan", label: "Bulan", href: bulanHref },
              ].map((r) => (
                <Link
                  key={r.id}
                  href={r.href}
                  aria-current={mode === r.id ? "true" : undefined}
                  className={cx(
                    "flex h-[34px] items-center rounded-md px-3.5 text-[13px]",
                    mode === r.id ? "bg-ink font-medium text-white" : "text-muted hover:text-ink",
                  )}
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </>
        }
      />

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <div className="min-w-[860px] sm:min-w-[900px]">
          {/* day header */}
          <div className="grid grid-cols-[170px_1fr] sm:grid-cols-[280px_1fr] border-b border-line">
            <div className="sticky left-0 z-20 bg-surface px-4 py-3 text-xs font-medium text-muted sm:px-5">Tugas</div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
              {days.map((d, i) => (
                <div
                  key={d}
                  className={cx(
                    "py-3 text-center text-[11px] text-muted",
                    isWeekend(d) && "bg-weekend",
                    i === todayIdx && "rounded-md bg-accent! font-semibold text-white",
                  )}
                >
                  {mode === "minggu" ? `${weekdayShort(d)} ${parse(d).d}` : parse(d).d}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* weekend shading + today line */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[170px] right-0 sm:left-[280px]">
              {days.map((d, i) =>
                isWeekend(d) ? (
                  <div key={d} className="absolute inset-y-0 bg-weekend" style={{ left: pct(i), width: pct(1) }} />
                ) : null,
              )}
              {todayIdx !== null ? (
                <div className="absolute inset-y-0 z-10 w-0.5 bg-accent" style={{ left: pct(todayIdx + 0.5) }} />
              ) : null}
            </div>

            {groups.length === 0 ? (
              <p className="relative px-5 py-10 text-center text-muted">
                Tidak ada tugas di periode ini. Tugas muncul di sini setelah diberi tanggal mulai atau tenggat.
              </p>
            ) : (
              groups.map((g) => (
                <div key={g.key} className="relative">
                  <div className="sticky left-0 z-20 w-max px-4 pb-1.5 pt-4 text-xs font-semibold tracking-wide text-muted sm:px-5">
                    {g.title}
                    {g.month && monthKey(g.month) !== monthKey(from) ? ` · ${monthLabel(monthKey(g.month))}` : ""}
                  </div>
                  {g.bars.map((b) => {
                    const s = b.start < from ? from : b.start;
                    const e = b.end > to ? to : b.end;
                    const left = diffDays(from, s);
                    const width = diffDays(s, e) + 1;
                    const range = formatRange(b.start, b.openEnded ? null : b.end);
                    return (
                      <div key={b.id} className="grid grid-cols-[170px_1fr] sm:grid-cols-[280px_1fr] border-t border-line-soft">
                        <Link href={`/tugas/${b.id}`} className="sticky left-0 z-20 block min-w-0 border-r border-line-soft bg-surface px-4 py-2 hover:text-accent sm:border-r-0 sm:px-5">
                          <div className="truncate font-medium">{b.title}</div>
                          <div className="flex items-center gap-1.5 text-xs text-muted">
                            <StatusDot status={b.status} />
                            <span className="truncate">
                              {STATUS[b.status].label} · {range}
                            </span>
                          </div>
                        </Link>
                        <div className="relative h-[54px]">
                          <Link
                            href={`/tugas/${b.id}`}
                            title={`${b.title} (${range})`}
                            aria-label={`${b.title}, ${range}`}
                            className={cx(
                              "absolute top-4 h-[22px] rounded-md hover:brightness-95",
                              STATUS[b.status].bar,
                              b.start < from && "rounded-l-none",
                              b.end > to && "rounded-r-none",
                            )}
                            style={{ left: `calc(${pct(left)} + 2px)`, width: `calc(${pct(width)} - 4px)` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-5 text-[13px] text-muted">
        {LEGEND.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span aria-hidden="true" className={cx("h-3 w-[22px] rounded", STATUS[s].bar)} />
            {STATUS[s].label}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3.5 w-0.5 bg-accent" />
          Hari ini, {formatDateShort(today)}
        </div>
      </div>
    </>
  );
}
