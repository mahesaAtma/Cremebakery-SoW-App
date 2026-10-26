import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScopeForm } from "@/components/forms";
import { Card, PageHeader } from "@/components/ui";
import { monthKey } from "@/lib/dates";
import { ownerPage } from "@/lib/guard";
import { getScope } from "@/lib/queries";

export const metadata: Metadata = { title: "Ubah lingkup" };

export default async function EditScopePage({ params }: { params: Promise<{ id: string }> }) {
  await ownerPage();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const scope = await getScope(Number(id));
  if (!scope) notFound();
  const month = monthKey(scope.month);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Ubah lingkup" />
      <Card>
        <ScopeForm
          cancelHref={`/lingkup?bulan=${month}`}
          initial={{ id: scope.id, month, title: scope.title, description: scope.description, sortOrder: scope.sortOrder }}
        />
      </Card>
    </div>
  );
}
