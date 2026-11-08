"use client";

import { createContext, useActionState, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { Problem } from "@/components/problem";
import { updateLine, type ActionState } from "@/lib/actions";

// Which lines are saving a change; checkout waits until none are.
const Sync = createContext<{ busy: boolean; report: (lineId: string, pending: boolean) => void }>({ busy: false, report: () => {} });

export function BagSync({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<string[]>([]);
  const report = useCallback(
    (lineId: string, busy: boolean) => setPending((ids) => (busy ? (ids.includes(lineId) ? ids : [...ids, lineId]) : ids.filter((id) => id !== lineId))),
    [],
  );
  return <Sync value={{ busy: pending.length > 0, report }}>{children}</Sync>;
}

// One line's quantity, remove and price. Each button submits the quantity it
// would set; the totals come back from Openfront.
export function LineControls({ lineId, quantity, title, price }: { lineId: string; quantity: number; title: string; price: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateLine, null);
  const { report } = useContext(Sync);
  useEffect(() => {
    report(lineId, pending);
    return () => report(lineId, false);
  }, [lineId, pending, report]);
  const step = "flex h-full w-11 items-center justify-center disabled:opacity-40";
  return (
    <form action={action} aria-busy={pending}>
      <input type="hidden" name="lineId" value={lineId} />
      <div role="group" aria-label={`Quantity of ${title}`} className="flex h-11 w-[120px] items-center justify-between border border-line-strong">
        <button type="submit" name="quantity" value={quantity - 1} disabled={pending} aria-label={quantity === 1 ? `Remove ${title}` : `One fewer ${title}`} className={step}>
          <Minus className="size-3" strokeWidth={1.6} aria-hidden="true" />
        </button>
        <span className="text-[14px]" aria-live="polite">
          {quantity}
        </span>
        <button type="submit" name="quantity" value={quantity + 1} disabled={pending || quantity >= 20} aria-label={`One more ${title}`} className={step}>
          <Plus className="size-3" strokeWidth={1.6} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-1 flex items-center justify-between gap-4">
        <button type="submit" name="quantity" value={0} disabled={pending} className="flex min-h-11 min-w-11 items-center text-[12px] text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-40 lg:text-[12px]">
          Remove
        </button>
        <p className="text-[14px]">{pending ? <span className="text-muted">Updating...</span> : price}</p>
      </div>
      {state?.error && !pending && <Problem>{state.error}</Problem>}
    </form>
  );
}

export function CheckoutButton() {
  const { busy } = useContext(Sync);
  if (busy)
    return (
      <button type="button" disabled className="btn btn-primary w-full">
        Updating your bag...
        <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden="true" />
      </button>
    );
  return (
    <Link href="/checkout" className="btn btn-primary w-full">
      Checkout
      <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden="true" />
    </Link>
  );
}
