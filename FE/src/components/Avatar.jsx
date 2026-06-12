import { initials } from "../lib/utils";

export default function Avatar({ name, src, size = "md", className = "" }) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl"
  };

  return (
    <div
      className={`${sizes[size]} ${className} grid shrink-0 place-items-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#1767ff,#22a8ff_70%,#5b6cff)] font-semibold text-white shadow-sm ring-2 ring-white/80`}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}
