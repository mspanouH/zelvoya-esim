import AnchorLink from '@/components/AnchorLink';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { href: '/#destinations', label: 'All destinations' },
      { href: '/esim/japan', label: 'Japan eSIM' },
      { href: '/esim/italy', label: 'Italy eSIM' },
      { href: '/esim/united-states', label: 'United States eSIM' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/#faq', label: 'FAQ' },
      { href: '/contact', label: 'Contact us' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms & conditions' },
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/refund-policy', label: 'Refund policy' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--z-line)] bg-[var(--z-mist)]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="type-display text-xl tracking-[0.22em]">ZELVOYA</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--z-ink-soft)]">
              Travel eSIMs delivered by email in minutes. Go further. Stay
              connected.
            </p>
            <p className="type-mono mt-6 text-xs leading-relaxed text-[var(--z-ink-soft)]">
              support@zelvoya.com
              <br />
              +357 22 000 000
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="eyebrow">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <AnchorLink
                      href={link.href}
                      className="text-sm text-[var(--z-ink-soft)] transition-colors hover:text-[var(--z-ink)]"
                    >
                      {link.label}
                    </AnchorLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-[var(--z-line)] pt-8 text-xs text-[var(--z-ink-soft)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Zelvoya Ltd · 12 Stasikratous Street, 1065 Nicosia, Cyprus · Company
            no. HE 480221
          </p>
          <p className="type-mono">
            © {new Date().getFullYear()} Zelvoya Ltd. Prices include VAT.
          </p>
        </div>
      </div>
    </footer>
  );
}
