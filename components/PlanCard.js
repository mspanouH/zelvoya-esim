import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "../lib/catalog.js";

export default function PlanCard({ plan }) {
  return (
    <Link href={`/esim/${plan.slug}`} 
    className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--z-line)] bg-white transition-colors hover:border-[var(--z-ink)]"
    >
    <div className="relative aspect-[3/2] overflow-hidden">
        <Image
        src={plan.image}
        alt={plan.imageAlt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="type-mono absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-xs tracking-widest">
        {plan.countryCode}
        </span>
    </div>
    <div className="flex flex-1 flex-col p-5">
        <h3 className="type-display text-2xl">{plan.destination}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--z-ink-soft)]">
            {plan.tagline}
        </p>

        <p className="type-mono mt-5 border-t border-[var(--z-line)] pt-4 text-xs uppercase tracking-[0.14em] text-[var(--z-ink-soft)]">
            {plan.dataGb} GB · {plan.validityDays} days · {plan.network}
        </p>

        <div className="mt-4 flex items-end justify-between">
            <p className="type-display text-2xl">
            {formatPrice(plan.priceCents, plan.currency)}
            </p>
            <span className="text-sm text-[var(--z-ink-soft)] underline-offset-4 group-hover:underline">
            View plan
            </span>
        </div>
    </div>
    </Link>
    );
}