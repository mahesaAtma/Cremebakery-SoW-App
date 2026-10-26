import type { Metadata } from "next";
import Link from "next/link";
import { deleteScope } from "@/app/actions";
import { ConfirmAction } from "@/components/form-bits";
import { ScopeForm } from "@/components/forms";
import { btn, Card, MonthSwitcher, PageHeader, Prose } from "@/components/ui";
import { isOwner } from "@/lib/auth";
import { addMonths, isValidMonthKey, monthKey, monthLabel, todayStr } from "@/lib/dates";
import { listScopes } from "@/lib/queries";

export const metadata: Metadata = { title: "Lingkup kerja" };

export default async function ScopesPage({ searchParams }: { searchParams: Promise<{ bulan?: string }> }) {
  const sp = await searchParams;
  const month = isValidMonthKey(sp.bulan) ? sp.bulan : monthKey(todayStr());
  const [scopes, owner] = await Promise.all([listScopes(month), isOwner()]);

  return (
    <>
      <PageHeader
        title="Lingkup kerja"
        subtitle="Tujuan yang disepakati untuk tiap bulan"
        actions={
          <MonthSwitcher
            label={monthLabel(month)}
            prevHref={`/lingkup?bulan=${addMonths(month, -1)}`}
            nextHref={`/lingkup?bulan=${addMonths(month, 1)}`}
          />
        }
      />

      <div className="flex flex-col gap-5">
        {scopes.length === 0 ? (
          <Card>
            <p className="text-muted">Belum ada lingkup kerja untuk {monthLabel(month)}.</p>
          </Card>
        ) : (
          scopes.map((s) => {
            const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
            return (
              <Card key={s.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold">{s.title}</h2>
                    <p className="mt-0.5 text-[13px] text-muted">
                      {s.done} dari {s.total} tugas selesai
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Link href={`/tugas?lingkup=${s.id}`} className={btn.small}>Lihat tugas</Link>
                    {owner ? (
                      <>
                        <Link href={`/tugas/baru?lingkup=${s.id}`} className={btn.small}>+ Tugas</Link>
                        <Link href={`/lingkup/${s.id}/ubah`} className={btn.small}>Ubah</Link>
                        <ConfirmAction action={deleteScope.bind(null, s.id)} message="Hapus lingkup ini? Tugas di dalamnya tetap ada, hanya tidak lagi terhubung ke lingkup.">
                          Hapus
                        </ConfirmAction>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line-soft">
                  <div className="h-1.5 rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                {s.description ? (
                  <div className="mt-4 text-[13px]">
                    <Prose text={s.description} />
                  </div>
                ) : null}
              </Card>
            );
          })
        )}

        {owner ? (
          <Card>
            <h2 className="mb-4 text-base font-semibold">Tambah lingkup</h2>
            <ScopeForm initial={{ month, title: "", description: "", sortOrder: scopes.length }} />
          </Card>
        ) : null}
      </div>
    </>
  );
}
