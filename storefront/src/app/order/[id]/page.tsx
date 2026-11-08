import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import catalog from "@/catalog.json";
import { variantLine } from "@/lib/collection";
import { getOrder, lineImage, type Order } from "@/lib/store";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ key?: string }> };

// What Openfront's getCustomerOrder returns beyond the fields store.ts types.
type Address = { firstName?: string; lastName?: string; address1?: string; address2?: string | null; city?: string; province?: string; postalCode?: string; country?: { name?: string } | null };
type Details = Order & {
  shippingAddress?: Address | null;
  shippingMethods?: { shippingOption?: { name?: string } | null }[] | null;
  paymentDetails?: { cardLast4?: string | null }[] | null;
};

const handleByTitle = new Map(catalog.products.map((p) => [p.title, p.handle]));
const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");

// Rendered only from a real order that Openfront returns for this customer
// (signed in) or this guest (the order's secret key).
export default async function OrderPage({ params, searchParams }: Props) {
  const [{ id }, { key }] = await Promise.all([params, searchParams]);
  const order = (await getOrder(id, key)) as Details | null;
  if (!order) notFound();
  const canceled = order.status === "canceled";
  const shipping = order.fulfillmentStatus?.shippingStatus;
  const shipped = shipping === "shipped" || shipping === "partially_shipped";
  const produced = shipped || ["fulfilled", "partially_fulfilled"].includes(order.fulfillmentStatus?.status ?? "");
  const tracking = (order.fulfillments ?? []).flatMap((f) => f.shippingLabels).filter((l) => l.trackingNumber);
  const shippedAt = (order.fulfillments ?? []).find((f) => f.shippingLabels.length)?.createdAt;
  const steps = [
    { label: "Confirmed", done: true, note: day(order.createdAt) },
    { label: "In production", done: produced, note: "" },
    { label: shipping === "partially_shipped" ? "Partly shipped" : "Shipped", done: shipped, note: shipped ? day(shippedAt) : "" },
  ];
  const address = order.shippingAddress;
  const method = order.shippingMethods?.[0]?.shippingOption?.name;
  const card = order.paymentDetails?.find((p) => p.cardLast4)?.cardLast4;
  const paid = card ? ["Paid by card", `Ending in ${card}`] : order.paymentDetails?.length ? ["Paid"] : ["Ordered on account"];
  const contact = process.env.SUPPORT_EMAIL || null;
  const totals: [string, string | undefined][] = [
    ["Subtotal", order.subtotal],
    ["Shipping", order.shipping],
    ["Tax", order.tax],
  ];

  return (
    <div className="frame">
      <section aria-labelledby="order-title" className="pt-10 lg:flex lg:items-end lg:justify-between lg:gap-10 lg:pt-14">
        <div>
          <p className="num flex items-center gap-2.5 text-[12px] text-muted">
            <span className={`flex size-5 items-center justify-center rounded-full ${canceled ? "bg-line" : "bg-green text-sunk"}`} aria-hidden="true">
              {!canceled && <Check className="size-3" strokeWidth={2.2} />}
            </span>
            Order #{order.displayId}
          </p>
          <h1 id="order-title" className="display t-title mt-5">
            {canceled ? "Order canceled" : "Order confirmed"}
          </h1>
          <p className="mt-5 max-w-[530px] text-[15px] leading-[1.5] text-muted">
            {canceled ? "This order was canceled. Nothing more will be made or shipped for it." : `Confirmation sent to ${order.email}.`}
          </p>
        </div>
        <Link href="/shop" className="btn btn-line mt-8 w-full shrink-0 lg:mt-0 lg:w-[300px]">
          Shop all
          <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden="true" />
        </Link>
      </section>

      <div className="mt-12 grid gap-12 border-t border-line pt-9 lg:mt-14 lg:grid-cols-[minmax(0,620px)_minmax(0,564px)] lg:justify-between lg:gap-16">
        <div>
          {!canceled && (
            <section aria-labelledby="made-title">
              <h2 id="made-title" className="display t-sub">
                Progress
              </h2>
              <p className="mt-3 text-[13px] leading-[1.5] text-muted">Printed to order in 2 to 5 business days. Tracking appears here when it ships.</p>
              <ol aria-label="Order progress" className="mt-8 grid grid-cols-3 gap-4">
                {steps.map((step) => (
                  <li key={step.label}>
                    <span className={`block h-[2px] ${step.done ? "bg-ink" : "bg-line"}`} aria-hidden="true" />
                    <p className="mt-3 text-[12px] lg:text-[13px]">
                      {step.label}
                      <span className="sr-only">{step.done ? ", done" : ", not yet"}</span>
                    </p>
                    {step.note && <p className="mt-1 text-[12px] text-muted lg:text-[12px]">{step.note}</p>}
                  </li>
                ))}
              </ol>
              {tracking.length > 0 && (
                <ul className="mt-5 space-y-1 text-[13px]">
                  {tracking.map((t) => (
                    <li key={t.trackingNumber}>
                      {t.carrier ? `${t.carrier}: ` : "Tracking: "}
                      {t.trackingUrl ? (
                        <a href={t.trackingUrl} className="link inline-flex min-h-11 items-center" rel="noreferrer">
                          {t.trackingNumber}
                        </a>
                      ) : (
                        t.trackingNumber
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          <div className="mt-12 grid grid-cols-2 gap-6">
            {address && (
              <div>
                <h2 className="caps text-muted">Ship to</h2>
                <p className="mt-3 text-[12px] leading-[1.5] text-muted lg:text-[14px]">
                  {address.firstName} {address.lastName}
                  <br />
                  {address.address1}
                  {address.address2 ? `, ${address.address2}` : ""}
                  <br />
                  {address.city}, {address.province} {address.postalCode}
                  <br />
                  {address.country?.name ?? "United States"}
                </p>
              </div>
            )}
            <div>
              <h2 className="caps text-muted">Delivery</h2>
              <p className="mt-3 text-[12px] leading-[1.5] text-muted lg:text-[14px]">
                {method ?? "Shipping"}
                <br />
                <br />
                {paid.map((line, i) => (
                  <span key={line}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </div>
          <p className="mt-10 text-[13px] leading-[1.5] text-muted">
            Questions about your order?{" "}
            {contact ? (
              <a href={`mailto:${contact}?subject=${encodeURIComponent(`Order #${order.displayId}`)}`} className="link text-ink">
                Contact us
              </a>
            ) : (
              <Link href="/shipping" className="link text-ink">
                See shipping and returns
              </Link>
            )}{" "}
            with your order number.
          </p>
        </div>

        <aside aria-labelledby="pieces-title" className="summary-panel h-fit p-6">
          <h2 id="pieces-title" className="display t-sub">
            Pieces
          </h2>
          <ul className="mt-7">
            {(order.lineItems ?? []).map((line) => {
              const handle = line.productData?.handle ?? handleByTitle.get(line.title);
              return (
                <li key={line.id} className="flex gap-3.5 border-b border-line py-[18px] first:pt-0">
                  <div className="relative h-[78px] w-[62px] shrink-0 overflow-hidden">
                    {handle && <Image src={lineImage(handle, line.variantTitle)} alt="" fill sizes="62px" className="object-contain" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="t-card text-[13px]">{line.title}</p>
                    <p className="mt-1.5 text-[12px] leading-[1.45] text-muted">
                      {variantLine(line.variantTitle)}
                      <br />
                      Quantity {line.quantity}
                    </p>
                  </div>
                  <p className="num text-[13px]">{line.formattedTotal}</p>
                </li>
              );
            })}
          </ul>
          <dl className="num mt-8 space-y-4 text-[13px]">
            {totals
              .filter(([, value]) => value)
              .map(([term, value]) => (
                <div key={term} className="flex justify-between gap-4">
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
          <div className="num mt-8 flex items-baseline justify-between gap-4 border-t border-line-strong pt-5 text-[17px] font-medium">
            <p>Total</p>
            <p>{order.total}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
