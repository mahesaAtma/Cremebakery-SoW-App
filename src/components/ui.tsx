import Link from "next/link";
import type { TaskStatus } from "@/db/schema";
import { STATUS } from "@/lib/labels";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export const btn = {
  primary:
    "inline-flex h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg bg-ink px-4 font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60",
  secondary:
    "inline-flex h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg border border-line bg-surface px-3 text-ink hover:bg-tint disabled:cursor-not-allowed disabled:opacity-60",
  small:
    "inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-line bg-surface px-2.5 text-[13px] text-ink hover:bg-tint",
  danger:
    "inline-flex h-8 cursor-pointer items-center justify-center rounded-md px-2.5 text-[13px] text-red-700 hover:bg-red-50",
};

export const inputCls =
  "block w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink placeholder:text-stone-400 focus:border-stone-400 focus:outline-none";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cx("rounded-xl border border-line bg-surface p-5 sm:p-6", className)}>{children}</section>;
}

export function CardTitle({
  children,
  dot,
  action,
}: {
  children: React.ReactNode;
  dot?: TaskStatus;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {dot ? <StatusDot status={dot} /> : null}
        <h2 className="text-base font-semibold">{children}</h2>
      </div>
      {action}
    </div>
  );
}

export function StatusDot({ status, className }: { status: TaskStatus; className?: string }) {
  return <span aria-hidden="true" className={cx("inline-block size-2 shrink-0 rounded-full", STATUS[status].dot, className)} />;
}

export function StatusChip({ status }: { status: TaskStatus }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", STATUS[status].chip)}>
      <StatusDot status={status} />
      {STATUS[status].label}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="border-t border-line-soft py-4 text-muted">{children}</p>;
}

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function MonthSwitcher({
  label,
  prevHref,
  nextHref,
}: {
  label: string;
  prevHref: string;
  nextHref: string;
}) {
  return (
    <div className="flex items-center rounded-lg border border-line bg-surface">
      <Link href={prevHref} aria-label="Sebelumnya" className="flex size-10 items-center justify-center hover:bg-tint">
        <Chevron dir="left" />
      </Link>
      <span className="min-w-[120px] px-2 text-center font-medium">{label}</span>
      <Link href={nextHref} aria-label="Berikutnya" className="flex size-10 items-center justify-center hover:bg-tint">
        <Chevron dir="right" />
      </Link>
    </div>
  );
}

export function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

/** Renders plain text with line breaks preserved */
export function Prose({ text }: { text: string }) {
  if (!text) return null;
  return <div className="whitespace-pre-line break-words">{text}</div>;
}
