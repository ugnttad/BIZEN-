import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "../lib/utils";

const toneStyles = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200"
};

const toneBars = {
  blue: "from-blue-600 via-sky-400 to-teal-300",
  violet: "from-violet-600 via-fuchsia-400 to-blue-400",
  emerald: "from-emerald-500 via-teal-400 to-sky-400",
  amber: "from-amber-500 via-orange-400 to-rose-400",
  rose: "from-rose-500 via-pink-400 to-amber-300",
  slate: "from-slate-700 via-slate-400 to-slate-200"
};

export default function StatCard({ title, value, helper, icon: Icon, tone = "blue", trend }) {
  const isDown = trend?.startsWith("-");

  return (
    <section className="premium-card group h-full min-h-[148px] overflow-hidden rounded-2xl p-4">
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", toneBars[tone] || toneBars.blue)} />
      <div className="relative z-10">
        <div className="flex min-h-11 items-start justify-between gap-3">
          <p className="min-w-0 pr-1 text-sm font-semibold leading-snug text-slate-500">{title}</p>
          {Icon ? (
            <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-105", toneStyles[tone])}>
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
        </div>
        <p className="mt-3 break-words text-2xl font-bold leading-tight tracking-normal text-slate-950">{value}</p>
        <div className="mt-4 flex min-h-5 flex-wrap items-center gap-2 text-xs leading-snug text-slate-500">
          {trend ? (
            <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 font-bold", isDown ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
              {isDown ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
              {trend}
            </span>
          ) : null}
          <span className="min-w-0 break-words">{helper}</span>
        </div>
      </div>
    </section>
  );
}
