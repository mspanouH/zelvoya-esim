/**
 * Shared shell for the legal pages.
 *
 * They differ only in their text, so the heading, the last-updated line and the
 * prose spacing live in one place. Tailwind has no typography plugin here, so
 * the spacing rules are applied to child elements directly.
 */
export default function LegalPage({ title, updated, children }) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="eyebrow">Zelvoya</p>
      <h1 className="type-display mt-3 text-4xl sm:text-5xl">{title}</h1>
      <p className="type-mono mt-4 text-xs uppercase tracking-widest text-[var(--z-ink-soft)]">
        Last updated {updated}
      </p>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-[var(--z-ink-soft)] [&_h2]:type-display [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:text-[var(--z-ink)] [&_li]:mt-2 [&_p]:mt-4 [&_strong]:text-[var(--z-ink)] [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
