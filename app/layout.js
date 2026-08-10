import { Inter, Newsreader, IBM_Plex_Mono } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';
import { readCart } from '@/lib/cart';

/**
 * next/font downloads these at build time and self-hosts them, so there is no
 * request to Google at runtime and no layout shift. Each font exposes a CSS
 * variable that globals.css reads (--font-display, --font-body, --font-mono).
 */
const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Zelvoya — Travel eSIMs. Go further. Stay connected.',
  description:
    'Instant travel eSIMs for over 190 destinations. Buy in minutes, scan a QR code, and land connected. No physical SIM, no roaming bills.',
};

export default async function RootLayout({ children }) {
  const cartCount = (await readCart()).length;
  return (
    <html lang="en">
      <body
        className={`${newsreader.variable} ${inter.variable} ${plexMono.variable} antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--z-ink)] focus:px-5 focus:py-3 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <Navbar cartCount={cartCount} />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
