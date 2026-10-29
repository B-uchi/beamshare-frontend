import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-panel">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div className="max-w-xs space-y-3">
          <Logo />
          <p className="text-sm text-ink-2">
            Files go straight from one browser to another. Nothing is uploaded or stored.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
          <Link href="/new" className="text-ink-2 hover:text-ink">Start a room</Link>
          <Link href="/how-it-works" className="text-ink-2 hover:text-ink">How it works</Link>
          <Link href="/join" className="text-ink-2 hover:text-ink">Join with a code</Link>
          <Link href="/privacy" className="text-ink-2 hover:text-ink">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
