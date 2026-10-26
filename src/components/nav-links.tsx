"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Ringkasan" },
  { href: "/linimasa", label: "Linimasa" },
  { href: "/tugas", label: "Tugas" },
  { href: "/lingkup", label: "Lingkup" },
  { href: "/jam", label: "Jam kerja" },
  { href: "/catatan", label: "Catatan" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi utama" className="-mx-1 flex flex-wrap gap-1">
      {LINKS.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={
              "rounded-lg px-3 py-2 " +
              (active ? "bg-tint font-medium text-ink" : "text-muted hover:text-ink")
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
