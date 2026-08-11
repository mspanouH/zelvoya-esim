// The test files import lib/order-service.js directly via the "@/" alias,
// and that file (plus lib/providers/esim-provider.js, which it imports) uses
// the same alias internally for lib/db.js. "@/" only means something to
// Next's bundler — Node's own loader has no idea what it is. Rather than
// writing a general-purpose alias resolver, this maps the exact specifiers
// actually used on these paths to their real files. If a module the tests
// pull in starts using a new "@/" import, add it here — this is
// deliberately a lookup table, not a rewrite rule, so it can't silently
// resolve something it wasn't written for.
//
// Registered via tests/support/register.mjs, loaded with `node --import`
// (see the "test" script in package.json).
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const ALIASES = {
  '@/lib/db': pathToFileURL(path.join(projectRoot, 'lib/db.js')).href,
  '@/lib/order-service': pathToFileURL(path.join(projectRoot, 'lib/order-service.js')).href,
  '@/lib/providers/esim-provider': pathToFileURL(
    path.join(projectRoot, 'lib/providers/esim-provider.js')
  ).href,
};

export async function resolve(specifier, context, nextResolve) {
  if (specifier in ALIASES) {
    return nextResolve(ALIASES[specifier], context);
  }
  return nextResolve(specifier, context);
}
