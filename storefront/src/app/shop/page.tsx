import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listProducts, money, type Product } from "@/lib/store";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage() {
  let products: Product[] = [];
  let failed = false;
  try {
    products = await listProducts();
  } catch {
    failed = true;
  }
  return (
    <div className="frame">
      <header className="flex items-end justify-between gap-6 border-b border-line pb-5 pt-10 lg:pt-14">
        <h1 className="display text-[44px] lg:text-[72px]">Shop</h1>
        <p className="caps pb-2 text-muted">{products.length} pieces</p>
      </header>
      {failed ? (
        <p className="mt-10 text-muted">The collection could not be loaded. Refresh to try again.</p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {products.map((p, i) => (
            <li key={p.id}>
              <Link href={`/products/${p.handle}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#c9c1b2]">
                  <Image src={p.image} alt={p.title} fill priority={i < 4} sizes="(min-width: 1024px) 23vw, (min-width: 768px) 31vw, 46vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                </div>
                <p className="caps mt-3">{p.title}</p>
                <p className="caps mt-1 text-muted">{money(p.price)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
