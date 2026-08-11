'use client';

import Link from 'next/link';

/**
 * A Link that scrolls to an in-page section on every click, not just when the
 * URL hash changes.
 *
 * The browser (and Next's router) only scrolls a hash link into view when the
 * hash in the URL actually changes. Scroll away from a section by hand and the
 * URL still reads e.g. "/#how-it-works" — click that same link again to
 * return to it and nothing happens, because the URL isn't changing.
 *
 * If the target section is already on the page, this scrolls to it directly
 * and skips the router. If it isn't (a link clicked from another page), it
 * falls through to a normal navigation and lets the browser jump to the hash
 * once the homepage has loaded.
 */
export default function AnchorLink({ href, onClick, ...props }) {
  const hash = href.includes('#') ? href.split('#')[1] : null;

  function handleClick(event) {
    if (hash) {
      const target = document.getElementById(hash);

      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });

        if (window.location.hash !== `#${hash}`) {
          window.history.pushState(null, '', `/#${hash}`);
        }
      }
    }

    onClick?.(event);
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
