import type { Metadata } from "next";
import Link from "next/link";
import { deleteNote } from "@/app/actions";
import { ConfirmAction } from "@/components/form-bits";
import { NoteForm } from "@/components/forms";
import { btn, Card, PageHeader, Prose } from "@/components/ui";
import { isOwner } from "@/lib/auth";
import { formatDate, todayStr } from "@/lib/dates";
import { listNotes, taskOptions } from "@/lib/queries";

export const metadata: Metadata = { title: "Catatan" };

export default async function NotesPage() {
  const owner = await isOwner();
  const [rows, tasks] = await Promise.all([listNotes(), owner ? taskOptions() : Promise.resolve([])]);

  return (
    <>
      <PageHeader title="Catatan" subtitle="Keputusan dan catatan penting selama pengerjaan" />

      <div className="flex flex-col gap-5">
        {owner ? (
          <Card>
            <h2 className="mb-4 text-base font-semibold">Catatan baru</h2>
            <NoteForm tasks={tasks} initial={{ date: todayStr(), title: "", body: "", taskId: null }} />
          </Card>
        ) : null}

        {rows.length === 0 ? (
          <Card>
            <p className="text-muted">Belum ada catatan.</p>
          </Card>
        ) : (
          <ol className="flex flex-col gap-5">
            {rows.map((n) => (
              <li key={n.id} id={`catatan-${n.id}`} className="scroll-mt-6">
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] text-muted">{formatDate(n.date)}</div>
                      <h2 className="text-base font-semibold">{n.title}</h2>
                    </div>
                    {owner ? (
                      <div className="flex items-center gap-1">
                        <Link href={`/catatan/${n.id}/ubah`} className={btn.small}>Ubah</Link>
                        <ConfirmAction action={deleteNote.bind(null, n.id)} message="Hapus catatan ini?">
                          Hapus
                        </ConfirmAction>
                      </div>
                    ) : null}
                  </div>
                  {n.body ? (
                    <div className="mt-3">
                      <Prose text={n.body} />
                    </div>
                  ) : null}
                  {n.taskId && n.taskTitle ? (
                    <div className="mt-3 text-[13px] text-muted">
                      Terkait: <Link href={`/tugas/${n.taskId}`} className="text-ink hover:text-accent">{n.taskTitle}</Link>
                    </div>
                  ) : null}
                </Card>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
