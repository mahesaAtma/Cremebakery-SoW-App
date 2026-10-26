import Link from "next/link";
import { btn } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-[28px] font-semibold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-muted">Mungkin tugas ini sudah dihapus atau tautannya salah.</p>
      <Link href="/" className={`${btn.secondary} mt-6`}>
        Kembali ke ringkasan
      </Link>
    </div>
  );
}
