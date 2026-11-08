import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BagSync, CheckoutButton, LineControls } from "@/components/bag";
import { ProductCard } from "@/components/product-card";
import { variantLine } from "@/lib/collection";
import { cartCount, getCart, lineImage, listProducts, type Product } from "@/lib/store";

export const metadata: Metadata = { title: "Bag" };

const STARTERS = ["sculpture-hoodie", "emperor-tee", "virtue-tee"];

async function EmptyBag() {
  let products: Product[] = [];
  try {
    products = await listProducts();
  } catch {
    // The suggestions are optional; the way back to the collection is not.
  }
  const starters = STARTERS.flatMap((handle) => products.find((p) => p.handle === handle) ?? []);
  return (
    <div className="frame">
      <header className="flex items-end justify-between gap-6 border-b-2 border-ink pb-5 pt-10 lg:pt-14">
        <h1 className="display t-title">Bag</h1>
        <p className="num pb-2 text-[12px] text-muted lg:pb-3">0 pieces</p>
      </header>
      <p className="mt-8 text-[15px] text-muted">Your bag is empty.</p>
      <Link href="/shop" className="btn btn-primary mt-6 w-full md:w-[300px]">
        Shop all
        <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden="true" />
      </Link>
      {starters.length > 0 && (
        <section aria-labelledby="start-title" className="mt-16 lg:mt-[72px]">
          <h2 id="start-title" className="display t-section border-b border-line pb-4">
            From the collection
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:gap-x-6">
            {starters.map((p, i) => (
              <div key={p.id} className={i === 2 ? "hidden md:block" : ""}>
                <ProductCard product={p} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 32vw, 45vw" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default async function CartPage() {
  const cart = await getCart();
  const lines = cart?.lineItems ?? [];
  if (!cart || !lines.length) return <EmptyBag />;
  const count = cartCount(cart);
  return (
    <BagSync>
      <div className="frame">
        <header className="flex items-end justify-between gap-6 pt-10 lg:pt-14">
          <h1 className="display t-title">Bag</h1>
          <p className="num pb-2 text-[12px] text-muted lg:pb-3">
            {count} piece{count === 1 ? "" : "s"}
          </p>
        </header>
        <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-[minmax(0,744fr)_minmax(0,488fr)] lg:gap-12 xl:gap-20">
          <div>
            <ul className="border-b border-line lg:border-b-0">
              {lines.map((line) => {
                const handle = line.productVariant.product.handle;
                return (
                  <li key={line.id} className="flex gap-6 border-t border-line pb-6 pt-6 lg:pb-12">
                    <Link href={`/products/${handle}`} className="relative h-[132px] w-24 shrink-0 overflow-hidden lg:h-[208px] lg:w-[156px]">
                      <Image src={lineImage(handle, line.productVariant.title)} alt="" fill sizes="156px" className="object-contain" />
                    </Link>
                    <div className="min-w-0 flex-1 pt-1">
                      <h2 className="display -mt-2 text-[18px] leading-[1.1] lg:text-[24px]">
                        <Link href={`/products/${handle}`} className="inline-flex min-h-11 items-center">
                          {line.title}
                        </Link>
                      </h2>
                      <p className="text-[12px] text-muted lg:mt-1 lg:text-[13px]">{variantLine(line.productVariant.title)}</p>
                      <div className="mt-4 lg:mt-7">
                        <LineControls lineId={line.id} quantity={line.quantity} title={line.title} price={line.total} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Link href="/shop" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-[14px] hover:text-muted lg:mt-6">
              <ArrowLeft className="size-3.5" strokeWidth={1.4} aria-hidden="true" /> Continue shopping
            </Link>
          </div>

          <aside aria-labelledby="summary-title" className="summary-panel h-fit p-6">
            <h2 id="summary-title" className="display t-sub">
              Order summary
            </h2>
            <dl className="num mt-7 space-y-4 text-[13px]">
              <div className="flex justify-between gap-4">
                <dt>Subtotal</dt>
                <dd>{cart.subtotal}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Shipping</dt>
                <dd>At checkout</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Tax</dt>
                <dd>At checkout</dd>
              </div>
            </dl>
            <div className="num mt-8 flex items-baseline justify-between gap-4 border-t border-line-strong pt-5 text-[17px] font-medium">
              <p>Subtotal</p>
              <p>{cart.subtotal}</p>
            </div>
            <div className="mt-6">
              <CheckoutButton />
            </div>
            <p className="mt-4 text-[12px] leading-[1.5] text-muted">Shipping and tax at checkout &middot; USD</p>
          </aside>
        </div>
      </div>
    </BagSync>
  );
}
