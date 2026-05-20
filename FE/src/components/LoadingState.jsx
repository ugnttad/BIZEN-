export default function LoadingState({ rows = 5 }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" aria-label="Đang tải">
      <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-12 gap-3">
            <div className="col-span-3 h-10 animate-pulse rounded bg-slate-100" />
            <div className="col-span-2 h-10 animate-pulse rounded bg-slate-100" />
            <div className="col-span-2 h-10 animate-pulse rounded bg-slate-100" />
            <div className="col-span-3 h-10 animate-pulse rounded bg-slate-100" />
            <div className="col-span-2 h-10 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
