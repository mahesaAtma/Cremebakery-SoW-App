import type { Metadata } from "next";
import { TaskForm } from "@/components/task-form";
import { PageHeader } from "@/components/ui";
import { isValidDate, monthKey, monthLabel, todayStr } from "@/lib/dates";
import { ownerPage } from "@/lib/guard";
import { scopeOptions } from "@/lib/queries";

export const metadata: Metadata = { title: "Tugas baru" };

type Search = Promise<{ lingkup?: string; mulai?: string }>;

export default async function NewTaskPage({ searchParams }: { searchParams: Search }) {
  await ownerPage();
  const sp = await searchParams;
  const scopes = await scopeOptions();
  const scopeId = sp.lingkup && scopes.some((s) => s.id === Number(sp.lingkup)) ? Number(sp.lingkup) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Tugas baru" />
      <TaskForm
        cancelHref="/tugas"
        scopes={scopes.map((s) => ({ id: s.id, label: `${s.title} · ${monthLabel(monthKey(s.month))}` }))}
        initial={{
          title: "",
          description: "",
          type: "feature",
          status: "planned",
          priority: "medium",
          scopeId,
          startDate: isValidDate(sp.mulai) ? sp.mulai : todayStr(),
          dueDate: null,
          waitingOn: "",
          waitingReason: "",
          researchQuestion: "",
          researchFinding: "",
          impactNote: "",
        }}
      />
    </div>
  );
}
