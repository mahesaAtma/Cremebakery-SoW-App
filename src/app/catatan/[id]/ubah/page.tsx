import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoteForm } from "@/components/forms";
import { Card, PageHeader } from "@/components/ui";
import { ownerPage } from "@/lib/guard";
import { getNote, taskOptions } from "@/lib/queries";

export const metadata: Metadata = { title: "Ubah catatan" };

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  await ownerPage();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [note, tasks] = await Promise.all([getNote(Number(id)), taskOptions()]);
  if (!note) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Ubah catatan" />
      <Card>
        <NoteForm
          tasks={tasks}
          cancelHref="/catatan"
          initial={{ id: note.id, date: note.date, title: note.title, body: note.body, taskId: note.taskId }}
        />
      </Card>
    </div>
  );
}
