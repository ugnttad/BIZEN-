import { initials } from "../lib/utils";

export default function Avatar({ name, size = "md", className = "" }) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl"
  };

  return (
    <div
      className={`${sizes[size]} ${className} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 font-semibold text-white shadow-sm`}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}
