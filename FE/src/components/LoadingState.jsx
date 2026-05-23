export default function LoadingState({ rows = 5 }) {
  return (
    <div className="premium-card rounded-2xl p-4" aria-label="Đang tải">
      <div className="shimmer-line h-5 w-40 rounded bg-slate-200" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-12 gap-3">
            <div className="shimmer-line col-span-3 h-10 rounded-xl bg-slate-100" />
            <div className="shimmer-line col-span-2 h-10 rounded-xl bg-slate-100" />
            <div className="shimmer-line col-span-2 h-10 rounded-xl bg-slate-100" />
            <div className="shimmer-line col-span-3 h-10 rounded-xl bg-slate-100" />
            <div className="shimmer-line col-span-2 h-10 rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
