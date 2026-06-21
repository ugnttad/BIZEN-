const socialLinks = [
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@bizen211?_r=1&_t=ZS-9721vZPY0H9",
    brandTextClass: "text-slate-950",
    iconClass: "bg-slate-950 text-white",
    hoverClass: "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path
          fill="currentColor"
          d="M16.7 3c.34 2.33 1.66 3.72 3.87 3.87v3.23a7.1 7.1 0 0 1-3.8-1.18v5.7c0 3.63-2.23 6.15-5.64 6.15a5.72 5.72 0 0 1-5.9-5.82c0-3.43 2.67-5.97 6.1-5.75v3.36c-1.58-.24-2.82.65-2.82 2.32 0 1.55 1.08 2.55 2.55 2.55 1.62 0 2.46-.95 2.46-2.91V3h3.18Z"
        />
      </svg>
    )
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61590576481183",
    brandTextClass: "text-[#1877F2]",
    iconClass: "bg-[#1877F2] text-white",
    hoverClass: "hover:border-blue-200 hover:bg-blue-50 hover:text-[#1877F2]",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path
          fill="currentColor"
          d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.46h-1.25c-1.24 0-1.62.77-1.62 1.56v1.91h2.76l-.44 2.91h-2.32V22C18.34 21.24 22 17.08 22 12.06Z"
        />
      </svg>
    )
  }
];

function scrollToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function SocialLinks({ variant = "floating", className = "" }) {
  if (variant === "footer") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <span className="text-sm font-semibold text-slate-500">Theo dõi BIZEN:</span>
        {socialLinks.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold transition ${item.brandTextClass} ${item.hoverClass}`}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className={`fixed bottom-5 right-5 z-40 hidden flex-col gap-2 sm:flex ${className}`} aria-label="Mạng xã hội BIZEN">
      {socialLinks.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className={`group inline-flex items-center justify-end gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-sm font-bold shadow-lg shadow-slate-950/10 backdrop-blur transition hover:-translate-y-0.5 ${item.brandTextClass} ${item.hoverClass}`}
        >
          <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all group-hover:max-w-24">{item.label}</span>
          <span className={`grid h-8 w-8 place-items-center rounded-full ${item.iconClass}`}>{item.icon}</span>
        </a>
      ))}
      <button
        type="button"
        onClick={scrollToTop}
        className="group inline-flex items-center justify-end gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-sm font-bold text-slate-700 shadow-lg shadow-slate-950/10 backdrop-blur transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        aria-label="Lên đầu trang"
      >
        <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all group-hover:max-w-24">Lên đầu</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-blue-700 ring-1 ring-blue-100 group-hover:bg-blue-700 group-hover:text-white">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path d="M12 5 5.75 11.25l1.4 1.4L11 8.8V20h2V8.8l3.85 3.85 1.4-1.4L12 5Z" fill="currentColor" />
          </svg>
        </span>
      </button>
    </div>
  );
}
