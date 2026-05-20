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

export default function StatCard({ title, value, helper, icon: Icon, tone = "blue", trend }) {
  const isDown = trend?.startsWith("-");

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">{value}</p>
        </div>
        {Icon ? (
          <div className={cn("grid h-10 w-10 place-items-center rounded-lg ring-1", toneStyles[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex min-h-5 items-center gap-2 text-xs text-slate-500">
        {trend ? (
          <span className={cn("inline-flex items-center gap-1 font-semibold", isDown ? "text-rose-600" : "text-emerald-600")}>
            {isDown ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            {trend}
          </span>
        ) : null}
        <span>{helper}</span>
      </div>
    </section>
  );
}
