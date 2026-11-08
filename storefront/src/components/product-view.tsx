"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Problem } from "@/components/problem";
import { addToCart, type ActionState } from "@/lib/actions";

type Variant = { id: string; title: string; price: number; options: string[] };
type Colour = { id: string; name: string; hex: string };

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

// Bone product page as in the mock: gallery left, title, price, colour swatches,
// sizes, size guide, ADD TO BAG, description, bullets and thumbnails.
export function ProductView({ title, price, blurb, bullets, photos, colours, sizes, variants }: {
  title: string; price: number; blurb: string; bullets: string[]; photos: string[]; colours: Colour[]; sizes: string[]; variants: Variant[];
}) {
  const [colour, setColour] = useState(colours[0]?.name ?? "");
  const [size, setSize] = useState("");
  const [shot, setShot] = useState(0);
  const [missing, setMissing] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(addToCart, null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const selected = variants.find((v) => v.options[0] === colour && v.options[1] === size);
  const [first, second] = [shot, (shot + 1) % photos.length];
  return (
    <div className="mt-2 grid gap-8 lg:grid-cols-12 lg:gap-x-12">
      <div className="lg:col-span-7">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#c9c1b2]">
          <Image key={photos[first]} src={photos[first]} alt={title} fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
        </div>
        {photos.length > 1 && (
          <ul className="mt-3 flex gap-3">
            {photos.map((src, i) => (
              <li key={src}>
                <button type="button" onClick={() => setShot(i)} aria-label={`Show photo ${i + 1} of ${photos.length}`} aria-pressed={i === shot} className="flex size-[72px] items-center justify-center">
                  <span className={`relative block size-16 overflow-hidden ${i === shot ? "outline outline-2 outline-ink" : "opacity-70"}`}>
                    <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                  </span>
                </button>
              </li>
            ))}
            <li className="caps flex items-center pl-2 text-muted">{shot + 1}/{photos.length}</li>
          </ul>
        )}
        <span className="hidden">{second}</span>
      </div>
      <div className="lg:col-span-5 lg:max-w-[440px] lg:pt-16">
        <h1 className="display text-[30px] leading-[1.1] lg:text-[34px]">{title}</h1>
        <p className="mt-4 text-[18px]" aria-live="polite">{money(selected?.price ?? price)}</p>

        <form action={action} className="mt-8">
          <input type="hidden" name="variantId" value={selected?.id ?? ""} />
          <input type="hidden" name="quantity" value={1} />
          <div role="group" aria-label={`Colour: ${colour}`} className="flex items-center gap-1">
            {colours.map((c) => (
              <button key={c.id} type="button" onClick={() => setColour(c.name)} aria-label={c.name} aria-pressed={c.name === colour} className="flex size-11 items-center justify-center">
                <span className={`block size-[22px] rounded-full ${c.name === colour ? "outline outline-2 outline-offset-2 outline-ink" : ""}`} style={{ background: c.hex }} />
              </button>
            ))}
            <span className="caps ml-2 text-muted">{colour}</span>
          </div>
          <div ref={sizeRef} role="group" aria-label="Size" className="mt-4 flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button key={s} type="button" onClick={() => { setSize(s); setMissing(false); }} aria-pressed={s === size}
                className={`caps h-11 min-w-11 border px-2 ${s === size ? "border-ink bg-ink text-paper" : "border-ink/60"}`}>
                {s}
              </button>
            ))}
          </div>
          {missing && !selected && <div className="mt-3"><Problem>Choose a size.</Problem></div>}
          <Link href="/size-guide" className="caps mt-3 inline-flex min-h-11 items-center underline underline-offset-4">Size guide +</Link>
          <button type="submit" aria-disabled={!selected || pending}
            onClick={(e) => { if (pending) e.preventDefault(); else if (!selected) { e.preventDefault(); setMissing(true); sizeRef.current?.querySelector("button")?.focus(); } }}
            className="btn btn-primary mt-4 w-full bg-[#0b0a09] text-[#e6ddd0]">
            {pending ? "Adding..." : "Add to bag"} <span aria-hidden="true">→</span>
          </button>
          <div aria-live="polite" className="min-h-6 pt-3 text-[13px]">
            {state?.error && !pending ? <Problem>{state.error}</Problem> : state?.ok && !pending ? (
              <p>{state.message} <Link href="/cart" className="link inline-flex min-h-11 items-center font-semibold">View cart</Link></p>
            ) : null}
          </div>
        </form>

        <p className="mt-6 max-w-[40ch] text-[14px] leading-[1.6]">{blurb}</p>
        <ul className="mt-5 list-disc pl-5 text-[14px] leading-[1.9]">
          {bullets.map((b) => <li key={b}>{b}</li>)}
        </ul>
        <p className="mt-6 border-t border-line pt-4 text-[13px] text-muted">Made to order by Printful and shipped from the US in 5 to 8 days. Flat $8 US shipping. <Link href="/shipping" className="link">Shipping &amp; returns</Link></p>
      </div>
    </div>
  );
}
