import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms";
import { Card } from "@/components/ui";
import { isOwner } from "@/lib/auth";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage() {
  if (await isOwner()) redirect("/");
  return (
    <div className="mx-auto max-w-sm pt-6">
      <h1 className="mb-1 text-[28px] font-semibold tracking-tight">Masuk</h1>
      <p className="mb-6 text-muted">Khusus pemilik untuk mengubah data.</p>
      <Card>
        <LoginForm />
      </Card>
    </div>
  );
}
