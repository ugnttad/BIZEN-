export default function BrandLogo({ compact = false, subtitle = "Cloud HR & Payroll", className = "" }) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-3 ${className}`}>
      <img src="/assets/bizen-app-icon.svg" alt="BIZEN" className={compact ? "h-10 w-10 shrink-0" : "h-12 w-12 shrink-0"} />
      {!compact ? (
        <span className="min-w-0">
          <span className="block text-xl font-bold tracking-normal text-slate-950">BIZEN</span>
          {subtitle ? <span className="block truncate text-xs font-medium text-slate-500">{subtitle}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
