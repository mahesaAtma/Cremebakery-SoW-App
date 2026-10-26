import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/task-form";
import { PageHeader } from "@/components/ui";
import { monthKey, monthLabel } from "@/lib/dates";
import { ownerPage } from "@/lib/guard";
import { getTask, scopeOptions } from "@/lib/queries";

export const metadata: Metadata = { title: "Ubah tugas" };

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  await ownerPage();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [data, scopes] = await Promise.all([getTask(Number(id), true), scopeOptions()]);
  if (!data) notFound();
  const t = data.task;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Ubah tugas" subtitle={t.title} />
      <TaskForm
        cancelHref={`/tugas/${t.id}`}
        scopes={scopes.map((s) => ({ id: s.id, label: `${s.title} · ${monthLabel(monthKey(s.month))}` }))}
        initial={{
          id: t.id,
          title: t.title,
          description: t.description,
          type: t.type,
          status: t.status,
          priority: t.priority,
          scopeId: t.scopeId,
          startDate: t.startDate,
          dueDate: t.dueDate,
          waitingOn: t.waitingOn,
          waitingReason: t.waitingReason,
          researchQuestion: t.researchQuestion,
          researchFinding: t.researchFinding,
          impactNote: t.impactNote,
        }}
      />
    </div>
  );
}
