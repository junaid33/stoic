import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { CardPayment, DetailsForm, SectionTitle, TradeOrder, type Saved } from "@/components/checkout-forms";
import { variantLine } from "@/lib/collection";
import { cartCookie } from "@/lib/session";
import { cardPayments, cartCount, getCart, getCustomer, lineImage, money, shippingOptions, stripePublishableKey, type Cart } from "@/lib/store";

export const metadata: Metadata = { title: "Checkout" };

type Props = { searchParams: Promise<{ edit?: string }> };

function Summary({ cart, final }: { cart: Cart; final: boolean }) {
  const rows: [string, string][] = [
    ["Subtotal", cart.subtotal],
    ["Shipping", final ? cart.shipping : "Next step"],
    ["Tax", final ? cart.tax : "Next step"],
  ];
  return (
    <>
      <ul>
        {cart.lineItems.map((line) => (
          <li key={line.id} className="flex gap-3.5 border-b border-line py-[18px] first:pt-0">
            <div className="relative h-[78px] w-[62px] shrink-0 overflow-hidden">
              <Image src={lineImage(line.productVariant.product.handle, line.productVariant.title)} alt="" fill sizes="62px" className="object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="t-card text-[13px]">{line.title}</p>
              <p className="mt-1.5 text-[12px] leading-[1.45] text-muted">
                {variantLine(line.productVariant.title)}
                <br />
                Quantity {line.quantity}
              </p>
            </div>
            <p className="num text-[13px]">{line.total}</p>
          </li>
        ))}
      </ul>
      <dl className="num mt-8 space-y-4 text-[13px]">
        {rows.map(([term, value]) => (
          <div key={term} className="flex justify-between gap-4">
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="num mt-8 flex items-baseline justify-between gap-4 border-t border-line-strong pt-5 text-[17px] font-medium">
        <p>{final ? "Total" : "Subtotal"}</p>
        <p>{final ? cart.total : cart.subtotal}</p>
      </div>
    </>
  );
}

const STEPS = ["Bag", "Details", "Delivery", "Payment"];

export default async function CheckoutPage({ searchParams }: Props) {
  const cart = await getCart();
  const cookie = await cartCookie();
  if (!cart || !cookie || !cart.lineItems.length) redirect("/cart");
  const [{ edit }, customer, card, options] = await Promise.all([searchParams, getCustomer(), cardPayments(), shippingOptions(cart.id, cookie.proof)]);
  const path = customer?.tradeAccount ? "trade" : card ? "card" : "closed";
  const address = cart.shippingAddress as (Cart["shippingAddress"] & { address2?: string | null; phone?: string | null }) | null;
  const detailsSaved = !!address && cart.shippingMethods.length > 0 && !!cart.email;
  const editing = !detailsSaved || edit === "1";
  const shipping = options.map((o) => ({ id: o.id, name: o.name, price: money(o.amount) }));
  const method = cart.shippingMethods[0]?.shippingOption;
  const methodPrice = shipping.find((o) => o.id === method?.id)?.price ?? cart.shipping;
  const step = editing ? 1 : 3;
  const saved: Saved = address
    ? { ...address, address2: address.address2 ?? undefined, phone: address.phone ?? undefined, email: cart.email }
    : { email: customer?.email };
  const count = cartCount(cart);

  return (
    <div className="frame grid gap-10 pt-8 lg:grid-cols-[minmax(0,620px)_minmax(0,484px)] lg:gap-x-16 lg:pt-[38px] xl:gap-x-32">
      <aside aria-labelledby="order-title" className="summary-panel h-fit lg:order-2">
        <details className="group lg:hidden">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-6 text-[14px] [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 font-medium">
              Your order ({count})
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" strokeWidth={1.4} aria-hidden="true" />
            </span>
            <span className="num">{detailsSaved ? cart.total : cart.subtotal}</span>
          </summary>
          <div className="px-6 pb-6 pt-2">
            <Summary cart={cart} final={detailsSaved} />
          </div>
        </details>
        <div className="hidden p-6 lg:block">
          <h2 id="order-title" className="display t-sub mb-7">
            Your order ({count})
          </h2>
          <Summary cart={cart} final={detailsSaved} />
        </div>
      </aside>

      <div className="lg:order-1">
        <h1 className="display t-title">Checkout</h1>
        <ol aria-label="Checkout steps" className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted lg:mt-8">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="size-3" strokeWidth={1.4} aria-hidden="true" />}
              {i === 0 ? (
                <Link href="/cart" className="flex min-h-11 min-w-11 items-center hover:text-ink">
                  {label}
                </Link>
              ) : (
                <span aria-current={i === step ? "step" : undefined} className={i === step ? "font-medium text-ink" : ""}>
                  {label}
                </span>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-6 lg:mt-8">
          {path === "closed" ? (
            <section aria-labelledby="closed-title">
              <SectionTitle id="closed-title">Card payments are not open yet</SectionTitle>
              <p className="mt-4 text-[14px] leading-[1.5] text-muted">Orders cannot be placed until they are, and nothing has been charged. Your bag is saved on this device.</p>
              <p className="mt-3 text-[14px] leading-[1.5] text-muted">
                Trade customers can{" "}
                <Link href="/account" className="link text-ink">
                  sign in
                </Link>{" "}
                to order on account.
              </p>
            </section>
          ) : editing ? (
            <DetailsForm saved={saved} options={shipping} selected={method?.id} />
          ) : (
            <>
              <section aria-labelledby="contact-title">
                <SectionTitle
                  id="contact-title"
                  action={
                    <Link href="/checkout?edit=1#contact" className="flex min-h-11 min-w-11 items-center justify-end text-[12px] hover:text-muted" aria-label="Edit contact">
                      Edit
                    </Link>
                  }
                >
                  Contact
                </SectionTitle>
                <p className="mt-3 text-[14px] text-muted">{cart.email}</p>
              </section>
              <section aria-labelledby="ship-title" className="mt-8">
                <SectionTitle
                  id="ship-title"
                  action={
                    <Link href="/checkout?edit=1#address" className="flex min-h-11 min-w-11 items-center justify-end text-[12px] hover:text-muted" aria-label="Edit shipping address">
                      Edit
                    </Link>
                  }
                >
                  Ship to
                </SectionTitle>
                <p className="mt-3 text-[14px] leading-[1.5] text-muted">
                  {address!.firstName} {address!.lastName}
                  <br />
                  {address!.address1}
                  {address!.address2 ? `, ${address!.address2}` : ""}
                  <br />
                  {address!.city}, {address!.province} {address!.postalCode}
                  <br />
                  United States
                </p>
              </section>
              <section aria-labelledby="delivery-title" className="mt-8">
                <SectionTitle
                  id="delivery-title"
                  action={
                    <Link href="/checkout?edit=1#delivery-title" className="flex min-h-11 min-w-11 items-center justify-end text-[12px] hover:text-muted" aria-label="Edit delivery">
                      Edit
                    </Link>
                  }
                >
                  Delivery
                </SectionTitle>
                <div className="mt-6 flex min-h-[72px] items-center gap-4 border border-ink bg-raise px-4">
                  <span className="size-[18px] shrink-0 rounded-full border-[5px] border-ink" aria-hidden="true" />
                  <span className="flex-1">
                    <span className="block text-[14px]">{method?.name ?? "Shipping"}</span>
                    <span className="mt-1 block text-[12px] text-muted">Printed to order</span>
                  </span>
                  <span className="num text-[14px]">{methodPrice}</span>
                </div>
              </section>
              <section aria-labelledby="payment-title" className="mt-10">
                <SectionTitle id="payment-title">{path === "trade" ? "Order on account" : "Payment"}</SectionTitle>
                <div className="mt-6">
                  {path === "trade" ? (
                    <TradeOrder total={cart.total} />
                  ) : (
                    <>
                      <p className="mb-5 text-[13px] font-medium">Credit or debit card</p>
                      <CardPayment publishableKey={stripePublishableKey()!} total={cart.total} />
                    </>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
