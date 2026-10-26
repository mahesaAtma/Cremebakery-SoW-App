"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-[28px] font-semibold tracking-tight">Terjadi kesalahan</h1>
      <p className="mt-2 text-muted">{error.message || "Coba muat ulang halaman."}</p>
      <button onClick={reset} className="mt-6 inline-flex h-10 cursor-pointer items-center rounded-lg border border-line bg-surface px-4 hover:bg-tint">
        Coba lagi
      </button>
    </div>
  );
}
