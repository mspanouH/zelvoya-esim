/**
 * Filter and sort controls.
 *
 * A plain HTML form with method="get". Submitting it navigates to
 * /admin/orders?status=…&q=…&sort=… and the page reads those values.
 *
 * No client component and no state: the URL *is* the state. That means a
 * filtered view can be bookmarked or sent to a colleague, the back button
 * works, and the whole thing functions without JavaScript.
 */

const STATUSES = [
  'CREATED',
  'PENDING_PAYMENT',
  'PAID',
  'PROVISIONING',
  'FULFILLED',
  'PAYMENT_DECLINED',
  'PAYMENT_TIMEOUT',
  'FULFILMENT_FAILED',
];

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'highest', label: 'Highest value' },
  { value: 'lowest', label: 'Lowest value' },
];

export default function AdminOrderFilters({ status = '', q = '', sort = 'newest' }) {
  const isFiltered = Boolean(status || q) || sort !== 'newest';

  return (
    <form
      method="get"
      action="/admin/orders"
      className="mt-8 flex flex-wrap items-end gap-4 rounded-2xl border border-[var(--z-line)] p-5"
    >
      <div className="min-w-[240px] flex-1">
        <label htmlFor="q" className="eyebrow block">
          Search
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Reference, email or name"
          className="mt-2 w-full rounded-xl border border-[var(--z-line)] px-4 py-2.5 text-sm focus:border-[var(--z-ink)] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="status" className="eyebrow block">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="type-mono mt-2 rounded-xl border border-[var(--z-line)] px-4 py-2.5 text-xs focus:border-[var(--z-ink)] focus:outline-none"
        >
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="sort" className="eyebrow block">
          Sort
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={sort}
          className="mt-2 rounded-xl border border-[var(--z-line)] px-4 py-2.5 text-sm focus:border-[var(--z-ink)] focus:outline-none"
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-primary px-6 py-2.5">
        Apply
      </button>

      {isFiltered && (
        <a href="/admin/orders" className="btn btn-secondary px-6 py-2.5">
          Clear
        </a>
      )}
    </form>
  );
}
