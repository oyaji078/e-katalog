"use client";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  message?: string;
}

export default function ErrorFallback({
  error,
  reset,
  title = "Terjadi Kesalahan",
  message = "Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.",
}: ErrorFallbackProps) {
  console.error("[error-boundary]", error.message, error.digest ?? "");

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
          <svg className="h-8 w-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-bold text-text">{title}</h1>
        <p className="mb-6 text-sm text-text-muted">{message}</p>
        {reset ? (
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
          >
            Coba Lagi
          </button>
        ) : null}
      </div>
    </div>
  );
}
