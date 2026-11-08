"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { ArrowRight } from "lucide-react";
import { Problem } from "@/components/problem";
import { completeCardOrder, placeTradeOrder, saveDetails, startCardPayment, type ActionState } from "@/lib/actions";

const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR".split(" ");

function Field({ label, name, className = "", ...rest }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      <input name={name} className="field" {...rest} />
    </label>
  );
}

export function SectionTitle({ id, children, action }: { id?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t-2 border-ink pt-5">
      <h2 id={id} className="display t-sub">
        {children}
      </h2>
      {action}
    </div>
  );
}

export type Saved = {
  email?: string | null;
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
};
export type ShippingChoice = { id: string; name: string; price: string };

// Contact, the US shipping address and the delivery option, saved together.
// The form is submitted by hand so nothing typed is cleared when Openfront
// rejects it.
export function DetailsForm({ saved, options, selected }: { saved: Saved; options: ShippingChoice[]; selected?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveDetails, null);
  const router = useRouter();
  // Saved: on to payment (and out of ?edit=1).
  useEffect(() => {
    if (state?.ok) router.replace("/checkout", { scroll: false });
  }, [state, router]);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <section aria-labelledby="contact-title" id="contact">
        <SectionTitle id="contact-title">Contact</SectionTitle>
        <Field label="Email address" name="email" type="email" autoComplete="email" required defaultValue={saved.email ?? ""} className="mt-6" />
      </section>
      <section aria-labelledby="address-title" id="address" className="mt-10">
        <SectionTitle id="address-title">Shipping address</SectionTitle>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
          <Field label="First name" name="firstName" autoComplete="given-name" required defaultValue={saved.firstName} />
          <Field label="Last name" name="lastName" autoComplete="family-name" required defaultValue={saved.lastName} />
          <label className="col-span-2 block">
            <span className="label">Country / region</span>
            <select name="country" autoComplete="country" defaultValue="us" className="field">
              <option value="us">United States</option>
            </select>
          </label>
          <Field label="Address" name="address1" autoComplete="address-line1" required defaultValue={saved.address1} className="col-span-2" />
          <Field label="Apartment, suite, etc. (optional)" name="address2" autoComplete="address-line2" defaultValue={saved.address2} className="col-span-2" />
          <Field label="City" name="city" autoComplete="address-level2" required defaultValue={saved.city} />
          <label className="block">
            <span className="label">State</span>
            <select name="province" autoComplete="address-level1" required defaultValue={saved.province ?? ""} className="field">
              <option value="" disabled>
                Select state
              </option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <Field label="ZIP code" name="postalCode" autoComplete="postal-code" inputMode="numeric" required defaultValue={saved.postalCode} />
          <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" defaultValue={saved.phone} />
        </div>
      </section>
      <section aria-labelledby="delivery-title" className="mt-10">
        <SectionTitle id="delivery-title">Delivery</SectionTitle>
        <div role="radiogroup" aria-labelledby="delivery-title" className="mt-6 space-y-2">
          {options.map((option, i) => (
            <label key={option.id} className="flex min-h-[72px] cursor-pointer items-center gap-4 border border-line-strong bg-raise px-4 transition-colors has-[:checked]:border-ink">
              <input type="radio" name="shippingOptionId" value={option.id} defaultChecked={selected ? selected === option.id : i === 0} className="radio" required />
              <span className="flex-1">
                <span className="block text-[14px]">{option.name}</span>
                <span className="mt-1 block text-[12px] text-muted">Printed to order</span>
              </span>
              <span className="num text-[14px]">{option.price}</span>
            </label>
          ))}
          {!options.length && <Problem>No delivery option is available for this bag yet. Nothing has been charged.</Problem>}
        </div>
      </section>
      <div aria-live="polite" className="mt-6 empty:hidden">
        {state?.error && !pending && <Problem>{state.error}</Problem>}
      </div>
      <button type="submit" disabled={pending || !options.length} className="btn btn-primary mt-6 w-full">
        {pending ? "Saving..." : "Continue to payment"}
        <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden="true" />
      </button>
    </form>
  );
}

export function TradeOrder({ total }: { total: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(placeTradeOrder, null);
  return (
    <form action={action}>
      <p className="text-[14px] leading-[1.5] text-muted">You are signed in with a trade account. This order is added to your account balance; no card is charged.</p>
      <div aria-live="polite" className="mt-4 empty:hidden">
        {state?.error && !pending && <Problem>{state.error}</Problem>}
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary mt-6 w-full">
        {pending ? "Placing order..." : `Place order on account, ${total}`}
        <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden="true" />
      </button>
    </form>
  );
}

let stripePromise: Promise<Stripe | null> | null = null;

// The card is entered in Stripe's own hosted fields; the order is completed
// only after Stripe confirms the payment, and the button stays busy until then.
function PayForm({ sessionId, total }: { sessionId: string; total: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function pay(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError(null);
    const result = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (result.error) {
      setError(result.error.message ?? "Your card was not charged.");
      setBusy(false);
      return;
    }
    const done = await completeCardOrder(sessionId);
    if (done?.error) {
      setError(done.error);
      setBusy(false);
    }
  }
  return (
    <form onSubmit={pay}>
      <PaymentElement />
      <div aria-live="polite" className="mt-4 empty:hidden">
        {error && <Problem>{error}</Problem>}
      </div>
      <button type="submit" disabled={!stripe || busy} className="btn btn-primary mt-6 w-full">
        {busy ? "Paying..." : `Pay ${total}`}
        <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden="true" />
      </button>
    </form>
  );
}

export function CardPayment({ publishableKey, total }: { publishableKey: string; total: string }) {
  const [payment, setPayment] = useState<{ clientSecret?: string; sessionId?: string; error?: string } | null>(null);
  useEffect(() => {
    stripePromise ??= loadStripe(publishableKey);
    startCardPayment().then(setPayment);
  }, [publishableKey]);
  if (!payment) return <p className="text-[14px] text-muted">Preparing secure payment...</p>;
  if (payment.error || !payment.clientSecret) return <Problem>{payment.error ?? "The payment could not be started."}</Problem>;
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: payment.clientSecret,
        appearance: {
          theme: "night",
          variables: { colorPrimary: "#ecebe6", colorBackground: "#161618", colorText: "#ecebe6", colorTextSecondary: "#a3a29c", colorDanger: "#ff7a6b", fontFamily: "system-ui, sans-serif", fontSizeBase: "16px", borderRadius: "0px" },
          rules: {
            ".Input": { border: "1px solid #3d3d42", boxShadow: "none", padding: "14px" },
            ".Input:focus": { border: "1px solid #4d86ff", boxShadow: "0 0 0 1px #4d86ff" },
            ".Label": { fontSize: "12px", fontWeight: "600", color: "#ecebe6" },
          },
        },
      }}
    >
      <PayForm sessionId={payment.sessionId!} total={total} />
    </Elements>
  );
}
