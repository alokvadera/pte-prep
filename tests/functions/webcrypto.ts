/* ---------------------------------------------------------------------------
   WebCrypto for the Workers handlers.

   jsdom ships a `crypto` object with `getRandomValues` and `randomUUID` but
   no `SubtleCrypto`, while the Cloudflare runtime has one and the handlers
   need it for HMAC (session tokens) and PBKDF2 (passwords). Node ships the
   same WebCrypto API, so the runtime gets the real implementation instead of
   a stub: every assertion about signatures and password hashes is then a
   statement about the real cryptography.

   Import this module *first* in a test file.
   --------------------------------------------------------------------------- */

import { webcrypto } from 'node:crypto'

const scope = globalThis as unknown as { crypto?: { subtle?: unknown } }

if (typeof scope.crypto?.subtle === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    writable: true,
    value: webcrypto,
  })
}
