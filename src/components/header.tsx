import Link from "next/link";
import { logout } from "@/app/actions";
import { NavLinks } from "./nav-links";

export function Header({ owner }: { owner: boolean }) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
          <Link href="/" className="text-base font-bold tracking-tight text-ink">
            Creme Bakery<span className="text-accent">.</span>
          </Link>
          <NavLinks />
        </div>
        {owner ? (
          <div className="flex items-center gap-2">
            <Link
              href="/tugas/baru"
              className="inline-flex h-10 items-center rounded-lg bg-ink px-4 font-medium text-white hover:bg-stone-700"
            >
              + Tugas baru
            </Link>
            <form action={logout}>
              <button className="h-10 cursor-pointer rounded-lg border border-line bg-surface px-3 hover:bg-tint">
                Keluar
              </button>
            </form>
          </div>
        ) : (
          <span className="text-[13px] text-muted">Tampilan baca saja</span>
        )}
      </div>
    </header>
  );
}
