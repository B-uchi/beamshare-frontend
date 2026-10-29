import Link from "next/link";
import { cn } from "@/lib/utils";

/** The Hop mark: a file arcing from one stop to the next. */
export function HopMark({ className, onCobalt = false }: { className?: string; onCobalt?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="7" fill={onCobalt ? "#fff" : "var(--cobalt)"} />
      <path
        d="M8.5 22.5C10 11 22 11 23.5 22.5"
        fill="none"
        stroke={onCobalt ? "var(--cobalt)" : "#fff"}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="8.5" cy="22.5" r="3" fill={onCobalt ? "var(--cobalt)" : "#fff"} />
      <circle cx="23.5" cy="22.5" r="3" fill="var(--signal)" />
    </svg>
  );
}

export function Logo({ className, href = "/", onCobalt }: { className?: string; href?: string; onCobalt?: boolean }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5 rounded-md", className)}
      aria-label="Hop home"
    >
      <HopMark onCobalt={onCobalt} />
      <span className="font-display text-[1.6rem] font-bold leading-none tracking-tight">Hop</span>
    </Link>
  );
}
