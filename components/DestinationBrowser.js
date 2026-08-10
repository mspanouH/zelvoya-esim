'use client';

import { useState } from 'react';
import PlanCard from '@/components/PlanCard';

export default function DestinationBrowser({ plans }) {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('All');

  // Region chips are derived from the plans, so adding a destination in a new
  // region makes its chip appear without touching this component.
  const regions = ['All', ...new Set(plans.map((plan) => plan.region))];

  const term = query.trim().toLowerCase();

  // A plan is shown when it passes both filters. Each filter passes
  // automatically when it isn't in use.
  const visiblePlans = plans.filter((plan) => {
    const matchesRegion = region === 'All' || plan.region === region;
    const matchesQuery =
      term === '' || plan.destination.toLowerCase().includes(term);
    return matchesRegion && matchesQuery;
  });

  function clearFilters() {
    setQuery('');
    setRegion('All');
  }

  return (
    <div>
      <div className="mx-auto max-w-md">
        <label htmlFor="destination-search" className="eyebrow block text-center">
          Search destinations
        </label>
        <input
          id="destination-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try Japan or United Kingdom"
          autoComplete="off"
          className="mt-3 w-full rounded-full border border-[var(--z-line)] bg-white px-6 py-3.5 text-center text-[15px] placeholder:text-[var(--z-ink-soft)] focus:border-[var(--z-ink)] focus:outline-none"
        />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {regions.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setRegion(name)}
            aria-pressed={region === name}
            className={`type-mono rounded-full border px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
              region === name
                ? 'border-[var(--z-ink)] bg-[var(--z-ink)] text-white'
                : 'border-[var(--z-line)] text-[var(--z-ink-soft)] hover:border-[var(--z-ink)]'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="sr-only">
        {visiblePlans.length} destinations shown
      </p>

      {visiblePlans.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-[var(--z-line)] px-6 py-16 text-center">
          <p className="type-display text-2xl">No destinations match your filters</p>
          <p className="mt-2 text-sm text-[var(--z-ink-soft)]">
            We cover 190+ countries. Clear your filters to see what is live
            today, or ask us about a destination.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="btn btn-secondary mt-6 px-6 py-3"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePlans.map((plan) => (
            <li key={plan.slug}>
              <PlanCard plan={plan} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}