export default function WorkflowStepsCard({ title, steps, skippable, className = "" }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 p-4 ${className}`}>
      {title ? <p className="text-sm font-bold text-slate-950">{title}</p> : null}
      <ol className={`${title ? "mt-3" : ""} space-y-2`}>
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm text-slate-700">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">{index + 1}</span>
            <span className="leading-6">{step}</span>
          </li>
        ))}
      </ol>
      {skippable?.length ? (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Có bỏ bước được không?</p>
          <ul className="mt-2 space-y-2">
            {skippable.map((item) => (
              <li key={item.step} className="text-xs leading-5 text-slate-600">
                <span className={`font-semibold ${item.canSkip ? "text-amber-700" : "text-rose-700"}`}>
                  {item.canSkip ? "Có thể bỏ" : "Không bỏ được"} — {item.step}:
                </span>{" "}
                {item.effect}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
