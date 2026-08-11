# Zelvoya — backlog and deliberate scope cuts

Working notes for the 48-hour build. Everything here was considered and
consciously deferred so the required order lifecycle could be finished properly.
This file is the source for the README's "what I would do next" section.

---

## If time allows (in priority order)

### 1. Sort the catalogue by price and name
~20 minutes. Purely client-side on an array already in memory. Two extra
controls next to the region chips. The clearest usability gap in the catalogue
as it stands.

### 2. Customer sign-up
~30–40 minutes once login exists: a form, a uniqueness check on email, a bcrypt
hash, and the same session cookie login already sets.

Not required by the brief, which asks for a customer account with order history —
satisfied by seeded demo accounts plus guest checkout. The natural version is an
opt-in "create an account to track this order" checkbox at checkout, since the
email and name are already being captured there. Building it as a separate page
duplicates a form for no gain.

### 3. Compact catalogue card at higher product counts
The current card leads with photography, which suits six premium destinations.
At seventy it would be an unreasonable amount of scrolling. A denser row layout
(flag, name, region, price) is the right shape at that scale — the reference
site uses exactly that, and for exactly that reason.

---

## Deferred by design

### Several plans per destination
The realistic model: a `Destination` has many `Plan`s (1 GB / 5 GB / 10 GB,
7 / 15 / 30 days), and `/esim/[slug]` presents the options.

Deferred because it changes the shape of the data — schema, seed, catalogue page
and plan page — for around two hours, and adds nothing to the order lifecycle
being assessed. The brief asks for six products purchasable end to end, which is
what exists.

### Multi-currency pricing
`currency` is already stored on `Plan`, `Order` and `Payment`, so the schema
does not assume euros. What is missing is exchange-rate handling and a decision
about when the rate locks — almost certainly at order creation, so a receipt
never changes retroactively.

Deliberately not attempted under time pressure. Half-implemented currency
handling is worse than none.

### Email delivery of the QR code
Real customers get the eSIM by email. Here it appears in the account and on the
receipt. Adding a mail provider is another integration and another failure mode;
the delivery mechanism is not what is being assessed.

### Device compatibility checker
The reference site gives this its own page, and for eSIM it is the top
pre-purchase question. Currently covered in the FAQ. A static supported-device
list with a search box would be an hour.

---

## Production hardening (beyond this exercise)

- **Webhook retries and a dead-letter path.** Callbacks are recorded and made
  idempotent, but a callback that fails mid-processing is not automatically
  retried. Production needs a queue with backoff and an alert on repeated
  failure.
- **Automatic fulfilment retry.** Admin retry is manual, as the brief requires.
  Production would retry transient provider failures automatically with backoff,
  reserving manual retry for exhausted cases.
- **Rate limiting** on login and the payment callback endpoint.
- **Observability.** Structured logs keyed by order reference, and an alert when
  any order sits in `FULFILMENT_FAILED` beyond a threshold.
- **Admin pagination.** Search, status filtering and sort by date/value now
  exist (`AdminOrderFilters`); the list is still capped at the first 100
  orders (`take: 100`) rather than paginated. Fine for a demo, not for volume.
- **Stock and availability checks against the provider** at add-to-cart and
  again at checkout, rather than trusting the `available` flag alone.
- **Real authentication.** Password reset, email verification, session
  revocation, and seeded demo users restricted to non-production environments.
- **Image hosting.** Photos are static files in `public/`, so changing one needs
  a deploy. Object storage plus an upload flow is the production shape.

---

## Known limitations of what was built

- One plan per destination; no quantity column (one order line per eSIM, which
  is what makes the no-double-delivery constraint possible).
- Catalogue search and filtering happen in the browser over six items. At scale
  this becomes a database query.
- Admin authentication is a role check on the session cookie, verified in the
  admin layout. Adequate here; a production system would want audit logging of
  admin actions — particularly retries, and admin views of a customer's live
  eSIM QR code and activation code via "View customer receipt." Those are
  usable install secrets, not just order metadata, and today that view is one
  click, unlogged.
- No soft deletes or full audit table. `PaymentEvent` provides the audit trail
  that matters for this domain.
- The guest order-access token (`signOrderAccess`) does not expire, by design —
  the receipt page is meant to work as a bookmark for as long as the order
  does. The trade-off: a leaked link (a screenshot, a shared inbox) grants
  access indefinitely, with no way to revoke a single link short of rotating
  `AUTH_SECRET` for everyone. A 30-day expiry was considered and rejected: an
  eSIM is often bought weeks ahead of travel, so the link would expire before
  the customer needed it.

---

## Testing

`tests/order-lifecycle.test.mjs` covers the order lifecycle at the
`lib/order-service.js` level — a successful payment, a duplicate callback, a
decline, a timeout, a provider failure, and an admin retry — calling
`applyPaymentEvent`, `retryFulfilment` and friends directly rather than over
HTTP, and asserting on database state afterwards, not just return values.

Not covered, deliberately: the callback route's signature verification
(`app/api/payments/callback/route.js`), the checkout/payment UI flow, and
admin access control. The brief does not ask for tests; the value here is a
runnable demonstration of the state machine during a walkthrough, not
coverage.
