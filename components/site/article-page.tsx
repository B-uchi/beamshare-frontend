import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

/** Shared shell for reading pages: a sign-style title band, then a comfortable measure. */
export function ArticlePage({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="bg-cobalt text-cobalt-ink">
        <SiteHeader tone="cobalt" />
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-8 sm:pb-20 sm:pt-10">
          <h1 className="max-w-4xl text-5xl font-bold leading-[0.95] sm:text-7xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-cobalt-ink-2 sm:text-xl">{lede}</p>
        </div>
      </div>
      <main className="bg-panel">
        <article className="prose-hop mx-auto max-w-[68ch] px-4 py-14 sm:px-8 sm:py-20">{children}</article>
      </main>
      <SiteFooter />
    </>
  );
}
