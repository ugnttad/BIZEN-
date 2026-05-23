import { Sparkles } from "lucide-react";

export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="relative mb-5 overflow-hidden rounded-2xl border border-white/70 bg-white/75 p-5 shadow-soft backdrop-blur-xl md:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-teal-400 to-amber-400" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          {eyebrow ? (
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-normal text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-3 text-2xl font-bold tracking-normal text-slate-950 md:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
