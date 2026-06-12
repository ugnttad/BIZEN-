import { Sparkles } from "lucide-react";

export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="brand-card relative mb-5 rounded-2xl p-5 md:p-6">
      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          {eyebrow ? (
            <p className="brand-eyebrow inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-normal">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
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
