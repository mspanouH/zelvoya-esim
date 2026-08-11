// Loaded via `node --import` before the test files themselves run (see the
// "test" script in package.json). This is the smallest hook Node offers for
// teaching its module resolver about a bundler-only import alias — no new
// dependency, and no change to any file under lib/.
import { register } from 'node:module';

register('./hooks.mjs', import.meta.url);
