# Zelvoya

A travel eSIM store, built as a 48-hour take-home for Trezuz (Track A: eSIM). Cart
through checkout, a mock payment service, server-confirmed order states, and
admin-driven recovery from a failed fulfilment.

**This is a demonstration.** There is no real payment gateway, no card fields
anywhere in the product, and no real eSIM is issued — Japan, Italy and the
other five destinations are fictional purchases against a mock provider.

## Live demo

https://zelvoya-esim.vercel.app

Repo: https://github.com/mspanouH/zelvoya-esim

## Demo accounts

Seeded by `prisma/seed.js`:

| Role     | Email               | Password           |
| -------- | -------------------- | ------------------- |
| Customer | `demo@zelvoya.test`  | `ZelvoyaDemo2026!`  |
| Admin    | `admin@zelvoya.test` | `ZelvoyaAdmin2026!` |

Checkout does not require an account — it works as a guest. A guest reaches
their receipt through the link they are redirected to after payment, which
carries a signed access token. If you check out using an email that already has
an account (`demo@zelvoya.test`, say), signing in with it also surfaces that
order under **Account → Order history**. There is no sign-up page — see
[Trade-offs](#trade-offs-and-what-id-do-next).

**Jump to:** [Order flow](#order-flow) · [Order states](#order-states) ·
[Place an order](#how-to-place-an-order) · [Decline](#how-to-trigger-a-declined-payment) ·
[Timeout](#how-to-trigger-a-payment-timeout) · [Provider failure](#how-to-trigger-a-provider-failure) ·
[Retry](#how-to-retry-a-failed-fulfilment) · [Idempotency](#idempotency) ·
[Tests](#tests) · [Security](#security-notes) ·
[Trade-offs](#trade-offs-and-what-id-do-next)

## Technology

| | |
|---|---|
| Framework | Next.js 16.3.0 (App Router, Server Actions) |
| UI | React 19.2.8, Tailwind CSS 4 |
| Database | PostgreSQL (Neon), via Prisma 6.19.3 |
| Auth | Signed session cookie (own implementation — no library) |
| Password hashing | bcryptjs 3.0.3 |
| QR generation | `qrcode` 1.5.4, rendered server-side |
| Tests | `node:test` and `node:assert` — built into Node, no test dependency |
| Lint | ESLint 9, `eslint-config-next` |

No payment SDK, no session-store service, no queue. The brief's failure and
retry paths are demonstrated with what a single Postgres database and two mock
provider modules can do honestly — see [Trade-offs](#trade-offs-and-what-id-do-next)
for what a production version would add.

## Architecture

```
zelvoya-esim/
├── app/
│   ├── page.js                    Homepage: catalogue, how it works, FAQ
│   ├── esim/[slug]/               Product page, add to cart
│   ├── cart/                      Cart, remove line
│   ├── checkout/                  Contact details → creates the order
│   ├── payment/[orderId]/         Pick a mock payment scenario, pay
│   ├── order/[orderId]/           Receipt + issued eSIM (the page a customer bookmarks)
│   ├── account/                   Signed-in order history + issued eSIMs
│   ├── admin/
│   │   ├── layout.js              Server-side role gate for everything under /admin
│   │   └── orders/                Order list, search/filter/sort, retry, replay
│   ├── api/payments/callback/     The only route that can move an order to PAID
│   ├── login/                     Sign in (demo accounts listed on the page)
│   └── contact/ privacy/ refund-policy/ terms/
├── components/                    Mostly server components; 'use client' only where
│                                  there's local state (forms, menus, filters)
├── lib/
│   ├── actions/                   Server actions: cart, checkout, payment, admin, auth
│   ├── providers/
│   │   ├── payment-provider.js    Mock payment service: signs and delivers callbacks
│   │   └── esim-provider.js       Mock eSIM supplier: catalogue + provisioning
│   ├── order-service.js           Order lifecycle: creation, payment events, fulfilment
│   ├── auth.js                    Session cookies, order access tokens
│   ├── cart.js                    Cart cookie (array of plan slugs)
│   ├── db.js                      Shared Prisma client
│   └── format.js                  Currency formatting
└── prisma/
    ├── schema.prisma
    ├── seed.js                    Six plans + two demo users
    ├── clear-orders.js            Wipes orders/payments/eSIMs, keeps plans and users
    └── migrations/
```

### Order flow

The part worth reading closely: **the browser can start a payment attempt, but
it can never confirm one.** Confirmation is a POST from the mock payment
service straight to the server, signed with a secret the browser has never
seen. Nothing the customer's browser sends is trusted to mean "paid."

```
 Browser                    Zelvoya server                  Mock payment service   Mock eSIM provider
    │                             │                                  │                     │
    │  submit checkout form       │                                  │                     │
    ├────────────────────────────>│ createOrder()                    │                     │
    │                             │  Order → CREATED                 │                     │
    │<──── redirect /payment ─────┤  (price read from DB, not form)  │                     │
    │                             │                                  │                     │
    │  pick scenario, "Pay now"   │                                  │                     │
    ├────────────────────────────>│ startPayment()                   │                     │
    │                             │  Order → PENDING_PAYMENT         │                     │
    │                             │  Payment row created (PENDING)   │                     │
    │                             │──── createCharge() ─────────────>│                     │
    │                             │                                  │ waits, then signs   │
    │                             │<─── POST /api/payments/callback ─┤ and delivers event  │
    │                             │  verify HMAC signature (401 if   │                     │
    │                             │  it doesn't match)               │                     │
    │                             │  applyPaymentEvent()             │                     │
    │                             │   1. insert PaymentEvent         │                     │
    │                             │      (unique eventId is the      │                     │
    │                             │       idempotency gate)          │                     │
    │                             │   2. Payment → SUCCEEDED/DECLINED│                     │
    │                             │      /TIMED_OUT                  │                     │
    │                             │   3. Order → PAID/DECLINED/      │                     │
    │                             │      TIMEOUT                     │                     │
    │                             │   4. if PAID: fulfilOrder() ───────────────────────────>│
    │                             │                                  │    provisionEsim()  │
    │                             │<─────────────────────────────────────────────────────────┤
    │                             │      Esim row created per line,  │                     │
    │                             │      Order → FULFILLED, or       │                     │
    │                             │      → FULFILMENT_FAILED         │                     │
    │                             ├──── 200 OK (always, once the ────>│                     │
    │                             │      event is durably recorded)  │                     │
    │<──── redirect /order/:id ───┤                                  │                     │
    │  GET /order/:id             │                                  │                     │
    ├────────────────────────────>│ render receipt, QR if FULFILLED  │                     │
```

`createCharge` in this demo `await`s the callback before returning, so the
whole round trip above happens inside one request-response cycle and the
result is deterministic to demo. That's a timing compression for the exercise,
not a shortcut on the mechanism: the callback is still a genuine, separately
authenticated HTTP request, and the state transition happens inside
`app/api/payments/callback/route.js`, not inside the action that renders the
"Pay" button. The reason it's awaited rather than fired into the background is
practical — a background task started in a serverless function can be killed
the moment that function returns.

## Order states

`OrderStatus` (`prisma/schema.prisma`) is a single enum column, not a set of
booleans:

| Status | Meaning |
|---|---|
| `CREATED` | Cart converted to an order. Nothing charged yet. |
| `PENDING_PAYMENT` | Customer sent to the payment page; a `Payment` attempt is open. |
| `PAID` | Payment confirmed by the server-side callback. |
| `PROVISIONING` | Fulfilment in progress — asking the eSIM provider to issue the eSIM. |
| `FULFILLED` | eSIM issued and visible to the customer. |
| `PAYMENT_DECLINED` | The payment service refused the payment. Nothing charged. |
| `PAYMENT_TIMEOUT` | No callback arrived in time. Nothing charged. |
| `FULFILMENT_FAILED` | Paid, but the eSIM provider failed. Recoverable — see [retry](#how-to-retry-a-failed-fulfilment). |

One column instead of `isPaid` / `isFulfilled` / `failed` booleans because a
set of independent flags can represent states that must never exist —
`fulfilled: true, paid: false`, or `failed: true` with no explanation of what
failed. A single enum makes those states unrepresentable instead of merely
avoided by discipline, and there is exactly one field to check anywhere in the
codebase to know what an order is doing. `Order.failureReason` carries the
human-readable detail for the two failure states; it's `null` everywhere else.

`Payment` carries its own status (`PENDING`, `SUCCEEDED`, `DECLINED`,
`TIMED_OUT`) because one order can have several attempts — a decline followed
by a successful retry keeps both rows rather than overwriting the history.

## Running locally

```bash
git clone https://github.com/mspanouH/zelvoya-esim.git
cd zelvoya-esim
npm install                 # postinstall also runs `prisma generate`
cp .env.example .env        # then fill in the values — see Environment variables
# set up the database — see Database setup below
npm run dev
```

Open http://localhost:3000.

## Environment variables

All defined in `.env.example`, values left out here on purpose:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled Postgres (Neon) connection. Used by the app at runtime. |
| `DATABASE_URL_UNPOOLED` | Direct, unpooled connection. Used by Prisma Migrate only. |
| `PAYMENT_WEBHOOK_SECRET` | Shared HMAC secret between the mock payment service and this app. Signs every callback; the callback route rejects anything not signed with it. |
| `AUTH_SECRET` | Signs the session cookie and the guest order-access token (see [Security notes](#security-notes)). |
| `NEXT_PUBLIC_BASE_URL` | This app's own base URL. The mock payment service needs an absolute URL to POST its callback to — set this to the deployed URL in production. |

`NEXT_PUBLIC_BASE_URL` is the only one with the public prefix, and it is
deliberate: that prefix is what compiles a value into the browser bundle. The
two secrets never carry it, so they stay server-side.

**Why two database connection strings:** migrations run DDL inside a
transaction and need a real, held-open session — a connection pooler
(`DATABASE_URL`, note the `-pooler` host) multiplexes many short-lived queries
over few connections and can't hold one open for the duration of a migration.
`DATABASE_URL_UNPOOLED` gives Prisma Migrate a direct connection for that; the
app itself always uses the pooled one at runtime.

## Database setup

```bash
npx prisma migrate deploy   # apply the migrations in prisma/migrations/
npx prisma db seed          # seed six plans + the two demo accounts above
```

The seed uses `upsert`, so it is safe to run more than once.

To wipe orders and start the funnel over without losing the catalogue or the
demo accounts:

```bash
node prisma/clear-orders.js
```

## Tests

```bash
npm test
```

Six cases against `lib/order-service.js` — the business rules everything else
depends on:

1. A successful payment callback fulfils the order and issues one eSIM per line
2. A duplicate callback with the same `eventId` does not double-fulfil
3. A declined payment leaves the order in `PAYMENT_DECLINED`, no eSIM issued
4. A payment timeout leaves the order in `PAYMENT_TIMEOUT`, no eSIM issued
5. A provider failure after a successful payment leaves the order recoverable,
   with the `Payment` still `SUCCEEDED` — the order is not lost
6. Admin retry on a `FULFILMENT_FAILED` order fulfils it without duplicating
   the eSIM

Each test creates its own data and cleans up after itself; `Plan` and `User`
rows are never touched, so the catalogue and demo accounts survive a run.

No UI or snapshot tests. The value here is the state machine and the
idempotency guarantee, not asserting that a button renders — and case 2 is the
one worth running, because it demonstrates in code what the
[Idempotency](#idempotency) section describes in prose.

Two notes on the setup, both also explained in code comments. `lib/` uses the
`@/` path alias, which only Next's bundler understands, so
`tests/support/hooks.mjs` remaps it for Node's own module loader rather than
changing any application import. And the npm script uses a glob rather than
`node --test tests/`, because on Node 22 for Windows the bare-directory form is
treated as a script to execute rather than a discovery root; the directory form
may work on Linux or macOS.

## How to place an order

1. On the homepage, open a destination — e.g. Japan — or scroll to
   **Destinations** and pick any of the six.
2. **Add to cart**, then open **Cart** from the navbar.
3. **Continue to checkout**, enter a name and an email address (any address —
   nothing is actually sent), **Continue to payment**.
4. On the payment page, choose **Successful payment** and press **Pay now**.
5. You're redirected to `/order/[id]` showing "Your eSIM is ready" with the QR
   code, ICCID, SM-DP+ address and activation code.

Sign in first with the demo customer account (or check out using
`demo@zelvoya.test`) to see the same order appear under **Account → Order
history** afterwards.

## How to trigger a declined payment

Same flow as above, but at step 4 choose **Declined payment**. After the
~0.7s simulated round trip you land on `/order/[id]` reading "Your payment was
declined." Order status is `PAYMENT_DECLINED`, nothing was charged, the cart
is left intact, and a **Try payment again** button is shown.

## How to trigger a payment timeout

Same flow, choose **Payment timeout** at step 4. The simulated delay is
~2.5s. Order status becomes `PAYMENT_TIMEOUT`, the customer sees "Your
payment timed out," nothing was charged, and **Try payment again** is
available — same recovery path as a decline.

## How to trigger a provider failure

Choose **Payment succeeds, eSIM provisioning fails** at step 4. The payment
itself succeeds (`Order` moves `PAID` → `PROVISIONING`), but
`provisionEsim()` is told to throw deliberately, and the order lands in
`FULFILMENT_FAILED` with a `failureReason`.

**The order is never lost.** The `Payment` row stays `SUCCEEDED`, the `Order`
row keeps its total and items, and no rollback undoes the fact that the
customer paid. This is also why fulfilment runs outside the transaction that
marks the order paid: marking paid has to be atomic, but a call to an external
provider must never be able to undo it.

What the customer sees on `/order/[id]` is deliberately calm and never shows
the real status name:

> Your payment is confirmed. We are currently preparing your eSIM and it is
> taking longer than usual. Your order is safe and our team has been
> notified — you will receive your QR code shortly.

The real state (`FULFILMENT_FAILED`) and the failure reason are visible only
on the admin order list.

## How to retry a failed fulfilment

1. Sign in as `admin@zelvoya.test` / `ZelvoyaAdmin2026!`.
2. Open **Admin** from the account menu, or go to `/admin/orders`.
3. The order from the previous step shows under **Needs attention**, bordered
   in red, with the failure reason printed on the card.
4. Press **Retry fulfilment**.
5. On success the order becomes `FULFILLED` and `/order/[id]` now shows the
   QR code the customer was waiting for.

**Why retry can't double-deliver:** retrying re-runs the same `fulfilOrder()`
used on the first attempt. It only provisions order lines that don't already
have an `Esim` row (`order.items.filter(i => !i.esim)`), and `Esim.orderItemId`
carries a database-level unique constraint. Even two retries racing each other
— an impatient double-click, or a retry overlapping a still-running attempt —
can produce at most one `Esim` per order line: the second `INSERT` hits the
constraint, and the code treats that as "another run got there first," not as
an error.

## Idempotency

The admin order list also exposes **Resend this payment notification**,
which redelivers the last event this order actually received — same
`eventId`, same payload, same signature. That's what a real payment provider
does when it doesn't get a timely acknowledgement, and it's the mechanism
this section describes. Expand **Payment events** on the same order to see
both deliveries recorded while the eSIM count stays where it was.

`PaymentEvent.eventId` carries a database-level unique constraint
(`prisma/schema.prisma`):

```prisma
model PaymentEvent {
  id         String   @id @default(cuid())
  eventId    String   @unique
  paymentId  String
  payment    Payment  @relation(fields: [paymentId], references: [id])
  type       String
  payload    Json
  receivedAt DateTime @default(now())
}
```

And the handling in `lib/order-service.js`:

```js
// 1. Record the event. This is the idempotency gate.
try {
  await prisma.paymentEvent.create({
    data: { eventId, paymentId: payment.id, type, payload: event },
  });
} catch (error) {
  if (error.code === 'P2002') {
    // Already processed. A valid response, not an error — otherwise the
    // provider keeps retrying a callback we have already acted on.
    return { status: 'already_handled', eventId };
  }
  throw error;
}

// 2. Act on it. Only reached the first time this event is seen.
switch (type) {
  case 'payment.succeeded': return handlePaymentSucceeded(payment, event);
  // ...payment.declined, payment.timeout
}
```

**Why not check-then-insert:** `SELECT ... WHERE eventId = ?` followed by an
`INSERT` if nothing came back has a race window. Two deliveries of the same
event arriving close together — which is exactly what a real payment provider
does when it doesn't get a fast enough 2xx — can both run the `SELECT` before
either has written its row, both see "not found," and both proceed to fulfil.
That's two eSIMs issued for one payment. Attempting the `INSERT` directly and
catching the unique-constraint violation (Prisma error code `P2002`, from
Postgres's own unique index) closes that window, because Postgres serializes
the two `INSERT`s itself: whichever commits first wins, and the second fails
atomically. There's no gap in which both can pass the check — the
correctness lives in the database, not in application logic that has to get
a race condition right.

**Why duplicates return 200, not an error:** `app/api/payments/callback/route.js`
returns `200` for `already_handled` on purpose. A non-2xx response is a
signal to the payment provider to retry the delivery — appropriate when
something genuinely went wrong (which is why an unexpected exception there
returns `500`, deliberately inviting a retry), but wrong for a callback
that's already been fully processed. Returning 200 for "already handled" is
what actually stops the provider from retrying forever.

## Security notes

- **No card fields anywhere.** `CheckoutForm` and `PaymentScenarioForm`
  collect a name, an email, and a test-scenario choice — never a card number,
  expiry or CVC. There's nothing to breach because there's nothing collected.
  Collecting card data would also put the application in PCI scope, which is
  why real merchants redirect to the processor or embed its iframe.
- **Signed callbacks.** `/api/payments/callback` computes an HMAC-SHA256 over
  the raw request body using `PAYMENT_WEBHOOK_SECRET` and compares it with
  `timingSafeEqual` (constant-time, so response timing can't leak the correct
  signature one byte at a time). An unsigned or mis-signed POST is rejected
  with `401` before the body is even parsed as JSON — it never reaches an
  order. The body is read as raw text rather than parsed JSON precisely
  because the signature covers those exact bytes.
- **Prices are never taken from the browser.** `createOrder()` re-reads each
  `Plan.priceCents` from the database for every slug in the cart cookie; the
  browser only ever sends slugs and contact details. `startPayment()` then
  reads the amount to charge from the `Order` row it already created. There's
  no request field a customer could edit to pay less.
- **Order page access control.** `/order/[id]` and `/payment/[id]` require
  either a signed-in session that owns the order (`Order.userId`, or matching
  email so a guest order still belongs to whoever later signs in with that
  address) or the admin role. Guest checkout has no session to check, so
  guests instead carry a token — `HMAC(AUTH_SECRET, "order:" + orderId)` —
  attached automatically to the redirect after checkout and payment. Without
  a valid session or token, both pages return `404`, not `403` — a stranger
  guessing at an order id doesn't get told the order exists.

  The honest limitation: a token in a URL is a bearer credential. It travels
  through browser history, screenshots and referrer headers, and it doesn't
  expire, because the receipt page is meant to be bookmarked ahead of a trip.
  The production answer isn't a shorter-lived token — it's emailing the
  receipt and showing activation details only to authenticated users.
- **Session handling.** The session cookie (`lib/auth.js`) is
  `httpOnly`, `sameSite: lax`, and holds a signed payload
  (`base64url(json).hmac`) verified with `timingSafeEqual` before it's
  trusted. It's signed rather than encrypted — anyone can read it, nobody can
  alter it. The role is looked up fresh from the database on every request
  rather than trusted from the cookie, so a role change takes effect
  immediately instead of waiting for the old cookie to expire.
- **Login doesn't leak which accounts exist.** "No such user" and "wrong
  password" return the same message, and bcrypt runs against a dummy hash even
  when no user was found, so response timing doesn't distinguish the two
  cases either.
- **Admin is guarded twice.** `app/admin/layout.js` redirects a non-admin
  server-side before any admin page renders — not a hidden nav link, an
  actual gate. Independently, every admin server action
  (`retryFulfilmentAction`, `replayLastEventAction`) re-checks `isAdmin()` on
  its own, because a server action is a callable endpoint in its own right
  and can be invoked without the page ever having loaded.

## AI-assisted development

I used Claude in two distinct ways, and the split matters:

**A long planning and review conversation**, in which the architecture was
worked through before code existed — the order state machine and why it's a
single enum, the decision to enforce idempotency with a database constraint
rather than application logic, where the provider boundary should sit, and
which requirements to cut under the time budget. I pushed back on several
suggestions and asked for the reasoning behind others; the decisions recorded
in this README and in `NOTES.md` came out of that process.

**Claude Code in the editor**, for implementation: scaffolding pages and
components, the repetitive CRUD and form wiring, drafting the legal pages and
this documentation, and a dedicated review pass that found and fixed an
access-control gap on the order and payment pages (the token scheme described
above — the order id alone was previously enough to view someone else's
receipt and their usable activation code).

Every suggestion was reviewed, adapted, and exercised against the actual
scenarios in this README — declined, timeout, provider failure, retry,
replay — before being kept. Several were rejected or reworked. The cart
originally cleared at order creation rather than on successful payment, which
meant a declined or cancelled payment silently emptied a basket nobody had paid
for. Catalogue search matched substrings across every field, so typing "c"
returned Japan because its region is "Asia Pacific" — sensible to the code,
nonsense to a customer. And a 30-day expiry on the guest access token was
considered and dropped: an eSIM is often bought weeks ahead of a trip, so the
link would have expired before the customer needed it. The real answer there is
emailing the receipt and gating activation details behind authentication, not a
shorter-lived token.

I can walk through any part of this codebase and explain why it is the way it
is.

## Trade-offs and what I'd do next

Full reasoning for each of these lives in `NOTES.md`. Summary:

**If I had more time:**
- Sort the catalogue by price and name — client-side, on data already in
  memory. The clearest usability gap in the storefront as it stands. (Search
  and region filtering already exist; sorting does not.)
- Customer sign-up as an opt-in "create an account to track this order"
  checkbox at checkout, rather than a separate form — the brief's account +
  order history requirement is met today via seeded demo accounts plus guest
  checkout matched by email. As it stands a pure guest has one route back to
  their receipt: the link. Closing that is the single most valuable half-hour
  left on the storefront.
- A denser catalogue card for higher product counts — the current
  photography-led card suits six destinations, not seventy.

**Deferred by design, not by accident:**
- Several plans per destination (`Destination` 1-to-many `Plan`) — changes
  the shape of the schema, seed and catalogue for around two hours, and adds
  nothing to the order lifecycle being assessed. Six plans, purchasable end
  to end, is what the brief asked for.
- Multi-currency pricing — `currency` is already a column on `Plan`, `Order`
  and `Payment`, so the schema doesn't assume euros. What's missing is
  exchange-rate handling and a decision on when the rate locks. Half-built
  currency handling is worse than none, so it wasn't attempted under time
  pressure.
- Email delivery of the QR code — it's in the account and on the receipt
  instead. A mail provider is another integration and another failure mode
  that isn't what this exercise is assessing.
- A device-compatibility checker — covered in the FAQ today; a static
  supported-device list with search would be about an hour.

**Production hardening beyond this exercise:**
- Webhook retries and a dead-letter path — callbacks are idempotent, but a
  callback that fails mid-processing isn't automatically retried.
- Automatic fulfilment retry with backoff for transient provider failures,
  reserving the manual admin retry for exhausted cases (the brief asks for
  manual retry specifically, which is what's built).
- Rate limiting on login and the payment callback endpoint.
- Structured, order-reference-keyed logging and an alert when an order sits
  in `FULFILMENT_FAILED` past a threshold.
- True admin pagination. Search, status filtering and sort by date/value now
  exist (`AdminOrderFilters`); the list is still capped at the first 100
  orders (`take: 100`) rather than paginated.
- Stock/availability checks against the provider at add-to-cart and again at
  checkout, instead of trusting the `available` flag alone.
- Real auth: password reset, email verification, session revocation, and
  demo accounts restricted to non-production environments.
- Object storage and an upload flow for destination photography, currently
  static files in `public/`.
- Audit logging of admin actions, particularly retries and — worth adding
  beyond what `NOTES.md` originally scoped — views of a customer's live eSIM
  QR code and activation code via "View customer receipt," which are usable
  install secrets, not just order metadata.

**Known limitations of what's built:**
- **Test coverage is deliberately narrow.** Six cases against the order
  lifecycle (see [Tests](#tests)) and nothing else — no UI, component or route
  tests. Those six are the rules the rest of the system depends on; a test
  asserting that a button renders would have cost time the failure paths
  needed. The callback route itself is covered indirectly, since the tests call
  `applyPaymentEvent` directly rather than going over HTTP — signature
  verification is exercised manually, not automatically. Admin access control
  (the role check in the admin layout, re-checked in each admin server action)
  is untested for the same reason — verified by hand, not in the suite.
- One plan per destination; no quantity column — one order line per eSIM is
  what makes the no-double-delivery guarantee straightforward.
- Catalogue search and region filtering happen client-side over six items;
  at real scale this becomes a database query. Admin filtering already runs
  in Postgres.
- No soft deletes or full audit table. `PaymentEvent` is the audit trail that
  actually matters for this domain — every callback received, in order,
  before anything acted on it.