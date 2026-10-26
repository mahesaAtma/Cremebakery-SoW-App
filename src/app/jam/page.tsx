import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardTitle, Empty, MonthSwitcher, PageHeader } from "@/components/ui";
import type { TaskType } from "@/db/schema";
import { addMonths, formatDate, formatHours, isValidMonthKey, monthKey, monthLabel, todayStr, weekdayShort } from "@/lib/dates";
import { TYPE, TYPE_VALUES } from "@/lib/labels";
import { hoursByMonth } from "@/lib/queries";

export const metadata: Metadata = { title: "Jam kerja" };

export default async function HoursPage({ searchParams }: { searchParams: Promise<{ bulan?: string }> }) {
  const sp = await searchParams;
  const month = isValidMonthKey(sp.bulan) ? sp.bulan : monthKey(todayStr());
  const logs = await hoursByMonth(month);

  const total = logs.reduce((s, l) => s + Number(l.hours), 0);

  const byTask = new Map<number, { title: string; type: TaskType; hours: number }>();
  for (const l of logs) {
    const row = byTask.get(l.taskId) ?? { title: l.taskTitle, type: l.taskType, hours: 0 };
    row.hours += Number(l.hours);
    byTask.set(l.taskId, row);
  }
  const taskRows = [...byTask.entries()].sort((a, b) => b[1].hours - a[1].hours);

  const byType = TYPE_VALUES.map((t) => ({
    type: t,
    hours: logs.filter((l) => l.taskType === t).reduce((s, l) => s + Number(l.hours), 0),
  })).filter((r) => r.hours > 0);

  const byDate = new Map<string, typeof logs>();
  for (const l of logs) byDate.set(l.date, [...(byDate.get(l.date) ?? []), l]);

  return (
    <>
      <PageHeader
        title="Jam kerja"
        subtitle={`Total ${formatHours(total)} jam di ${monthLabel(month)}`}
        actions={
          <MonthSwitcher
            label={monthLabel(month)}
            prevHref={`/jam?bulan=${addMonths(month, -1)}`}
            nextHref={`/jam?bulan=${addMonths(month, 1)}`}
          />
        }
      />

      {logs.length === 0 ? (
        <Card>
          <p className="text-muted">Belum ada jam tercatat di bulan ini.</p>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="flex min-w-0 flex-col gap-5">
            <Card>
              <CardTitle>Per tugas</CardTitle>
              <ul>
                {taskRows.map(([id, r]) => (
                  <li key={id} className="border-t border-line-soft">
                    <Link href={`/tugas/${id}`} className="flex items-center justify-between gap-3 py-3 hover:text-accent">
                      <span className="min-w-0">
                        <span className="font-medium">{r.title}</span>
                        <span className="text-[13px] text-muted"> · {TYPE[r.type]}</span>
                      </span>
                      <span className="shrink-0 tabular-nums">{formatHours(r.hours)} jam</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardTitle>Rincian harian</CardTitle>
              {[...byDate.entries()].map(([date, items]) => (
                <div key={date} className="border-t border-line-soft py-3">
                  <div className="mb-1 flex justify-between text-[13px] font-medium">
                    <span>
                      {weekdayShort(date)}, {formatDate(date)}
                    </span>
                    <span className="tabular-nums">{formatHours(items.reduce((s, l) => s + Number(l.hours), 0))} jam</span>
                  </div>
                  <ul className="text-[13px] text-muted">
                    {items.map((l) => (
                      <li key={l.id} className="flex justify-between gap-3">
                        <span className="min-w-0">
                          {l.taskTitle}
                          {l.note ? ` — ${l.note}` : ""}
                        </span>
                        <span className="shrink-0 tabular-nums">{formatHours(l.hours)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Card>
          </div>

          <aside>
            <Card>
              <CardTitle>Per jenis</CardTitle>
              {byType.length === 0 ? (
                <Empty>—</Empty>
              ) : (
                <ul className="flex flex-col gap-3 pt-2">
                  {byType.map((r) => {
                    const pct = total ? Math.round((r.hours / total) * 100) : 0;
                    return (
                      <li key={r.type}>
                        <div className="mb-1 flex justify-between text-[13px]">
                          <span>{TYPE[r.type]}</span>
                          <span className="tabular-nums text-muted">
                            {formatHours(r.hours)} jam · {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-line-soft">
                          <div className="h-1.5 rounded-full bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </aside>
        </div>
      )}
    </>
  );
}
