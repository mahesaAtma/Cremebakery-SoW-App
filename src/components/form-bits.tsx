"use client";

import { startTransition } from "react";
import { useFormStatus } from "react-dom";
import { btn, cx } from "./ui";

/**
 * Submit handler for forms driven by useActionState.
 * Unlike <form action>, it does not clear the fields afterwards,
 * so a validation error never wipes what the user typed.
 */
export function submitWith(formAction: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  };
}

export function SubmitButton({
  children,
  pendingText = "Menyimpan…",
  variant = "primary",
  className,
  pending: pendingProp,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: keyof typeof btn;
  className?: string;
  /** Pass isPending from useActionState when the form uses submitWith */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" disabled={pending} className={cx(btn[variant], className)}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-800">
      {error}
    </p>
  );
}

/** A small form with one button that asks for confirmation first. */
export function ConfirmAction({
  action,
  message,
  children,
  variant = "danger",
}: {
  action: () => Promise<void>;
  message: string;
  children: React.ReactNode;
  variant?: keyof typeof btn;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <SubmitButton variant={variant} pendingText="…">
        {children}
      </SubmitButton>
    </form>
  );
}
