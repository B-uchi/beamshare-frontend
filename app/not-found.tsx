import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/site/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col bg-ground">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8">
        <Logo />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-24">
        <div className="max-w-lg text-center">
          <div className="sign sign-tight mx-auto mb-8 inline-flex flex-col px-10 py-5">
            <span className="font-display text-7xl font-bold leading-none tnum">404</span>
          </div>
          <h1 className="text-4xl font-bold sm:text-5xl">This stop isn&rsquo;t on the line</h1>
          <p className="mt-3 text-lg text-ink-2">The page you were looking for doesn&rsquo;t exist.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="btn btn-signal btn-lg">
              Back home
            </Link>
            <Link href="/join" className="btn btn-outline btn-lg">
              Join with a code <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
