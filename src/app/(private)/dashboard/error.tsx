"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-rose-100">
      <div className="text-sm text-rose-600 font-medium">Something went wrong</div>
      <div className="text-xs text-rose-500 mt-1">{error.message}</div>
      <button onClick={reset} className="mt-3 text-xs px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50">
        Try again
      </button>
    </div>
  );
}