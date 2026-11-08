import Image from "next/image";
import Link from "next/link";
import { money, listProducts, type Product } from "@/lib/store";

const FEATURED = ["sculpture-hoodie", "emperor-tee", "stoic-ls", "virtue-tee"];

export default async function Home() {
  let products: Product[] = [];
  let failed = false;
  try {
    products = await listProducts();
  } catch {
    failed = true;
  }
  const row = FEATURED.flatMap((h) => products.find((p) => p.handle === h) ?? []);
  return (
    <>
      <h1 className="sr-only">STOIC</h1>
      <section aria-label="STOIC" className="relative isolate overflow-hidden bg-[#0b0a09]">
        <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[88%] md:w-[62%]">
          <Image src="/art/hero-bust.webp" alt="" fill priority sizes="(min-width: 768px) 62vw, 88vw" className="object-cover object-[30%_20%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0a09] via-[#0b0a09]/40 to-transparent md:via-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0b0a09] to-transparent" />
        </div>
        <div className="frame flex min-h-[560px] flex-col justify-center pb-10 pt-28 md:min-h-[640px] lg:min-h-[700px]">
          <p className="wordmark text-[clamp(88px,22vw,300px)] leading-[0.9] text-ink" aria-hidden="true">
            STOIC
          </p>
          <div className="mt-10 w-[104px] border-t border-ink/60 md:mt-16" />
          <Link href="/shop" className="caps mt-6 inline-flex min-h-11 items-center gap-3 self-start hover:opacity-70">
            Shop collection <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section aria-label="The collection" className="bg-[#0b0a09] pb-10">
        {failed ? (
          <p className="frame text-muted">The collection could not be loaded. Refresh to try again.</p>
        ) : (
          <ul className="frame grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
            {row.map((p, i) => (
              <li key={p.id}>
                <Link href={`/products/${p.handle}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#c9c1b2]">
                    <Image src={p.image} alt={p.title} fill sizes="(min-width: 768px) 23vw, 46vw" priority={i < 2} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  </div>
                  <p className="caps mt-3 text-[12px]">{p.title}</p>
                  <p className="caps mt-1 text-[12px] text-muted">{money(p.price)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Spring Summer 2026" className="relative isolate overflow-hidden bg-[#0b0a09]">
        <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-full md:w-[62%]">
          <Image src="/art/band-bust.webp" alt="" fill sizes="(min-width: 768px) 62vw, 100vw" className="object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0a09] via-[#0b0a09]/70 to-transparent" />
        </div>
        <div className="frame flex min-h-[260px] flex-col justify-center py-10">
          <p className="wordmark text-[56px] md:text-[64px]" aria-hidden="true">
            STOIC
          </p>
          <p className="caps mt-4">Spring / Summer 2026</p>
          <div className="mt-6 w-[40px] border-t border-ink/60" />
          <Link href="/shop" className="caps mt-4 inline-flex min-h-11 items-center gap-3 self-start underline underline-offset-4 hover:opacity-70">
            Explore the collection <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
