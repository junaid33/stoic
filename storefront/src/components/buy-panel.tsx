"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Factory, Shirt, Truck } from "lucide-react";
import { Problem } from "@/components/problem";
import { addToCart, type ActionState } from "@/lib/actions";

export type SizeOption = { id: string; size: string; price: number; sku: string };

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

// The buy panel (2026-10-27, from the diffui option the owner's brief asked
// for): set straight on the carbon page, no paper, no barcode. The title in
// expanded capitals, the price, a line on the piece, the sizes as square
// outlined keys, one off-white Add to bag, then three quiet facts between
// hairlines.
export function BuyPanel({
  title,
  lede,
  options,
  size,
  onSize,
  picker,
  facts,
  guideHref = "#size-guide",
  as: Heading = "h1",
  className = "",
}: {
  title: string;
  lede?: string;
  options: SizeOption[];
  size: string;
  onSize: (size: string) => void;
  picker?: React.ReactNode;
  facts?: string[];
  guideHref?: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addToCart, null);
  const [missing, setMissing] = useState(false);
  const sizes = useRef<HTMLDivElement>(null);
  const single = options.length === 1;
  const selected = single ? options[0] : options.find((o) => o.size === size);
  const low = Math.min(...options.map((o) => o.price));
  const price = selected ? money(selected.price) : `${options.some((o) => o.price !== low) ? "From " : ""}${money(low)}`;
  const rows = facts ?? ["Made to order by Printful, ships in 2 to 5 days", "Flat $8 US shipping", "Front only, nothing on the back"];
  const icons = [Factory, Truck, Shirt];

  return (
    <div className={className}>
      <Heading className="display t-product">{title}</Heading>
      <p className="num mt-4 text-[22px] font-medium lg:text-[24px]" aria-live="polite">
        {price}
      </p>
      {lede && <p className="mt-4 max-w-[52ch] text-[14px] leading-[1.6] text-muted">{lede}</p>}

      {picker}

      <form action={action} className="mt-6 border-t border-line pt-4">
        <input type="hidden" name="variantId" value={selected?.id ?? ""} />
        <input type="hidden" name="quantity" value={1} />
        {single ? (
          <p className="flex min-h-12 items-center justify-between text-[13px]">
            <span className="caps text-[12px] text-muted">Size</span>
            <span className="num">{options[0].size}</span>
          </p>
        ) : (
          <div>
            <div className="flex items-center justify-between gap-4">
              <p id="size-label" className="caps text-[12px] text-muted">
                Size
              </p>
              <a
                href={guideHref}
                onClick={() => {
                  const guide = document.getElementById("size-guide");
                  if (guide instanceof HTMLDetailsElement) guide.open = true;
                }}
                className="link inline-flex min-h-11 items-center text-[12px]"
              >
                Size guide
              </a>
            </div>
            <div ref={sizes} role="group" aria-labelledby="size-label" className="grid grid-cols-5 gap-2">
              {options.map((o) => {
                const active = o.size === size;
                return (
                  <button
                    key={o.size}
                    type="button"
                    onClick={() => {
                      onSize(o.size);
                      setMissing(false);
                    }}
                    aria-pressed={active}
                    className={`num h-12 border text-[13px] transition-colors duration-150 ${active ? "border-ink bg-ink text-paper" : "border-line-strong hover:border-ink"}`}
                  >
                    {o.size}
                  </button>
                );
              })}
            </div>
            {missing && !selected && (
              <div className="mt-3">
                <Problem>Choose a size.</Problem>
              </div>
            )}
          </div>
        )}
        <button
          type="submit"
          aria-disabled={!selected || pending}
          onClick={(event) => {
            if (pending) event.preventDefault();
            else if (!selected) {
              event.preventDefault();
              setMissing(true);
              sizes.current?.querySelector("button")?.focus();
            }
          }}
          className="btn btn-primary mt-4 w-full"
        >
          {pending ? "Adding..." : selected ? `Add to bag · ${money(selected.price)}` : "Add to bag"}
          <ArrowRight className="size-4" strokeWidth={1.6} aria-hidden="true" />
        </button>
        <div aria-live="polite" className="min-h-6 pt-3 text-[12px] leading-[1.5]">
          {state?.error && !pending ? (
            <Problem>{state.error} Your choices are kept; try again.</Problem>
          ) : state?.ok && !pending ? (
            <p className="flex flex-wrap items-center gap-x-2">
              <Check className="size-4 text-green" strokeWidth={2} aria-hidden="true" /> {state.message}
              <Link href="/cart" className="link inline-flex min-h-11 items-center font-semibold">
                View bag
              </Link>
            </p>
          ) : null}
        </div>
      </form>

      <ul className="mt-2 border-t border-line text-[13px]">
        {rows.map((text, i) => {
          const Icon = icons[i % icons.length];
          return (
            <li key={text} className="flex min-h-12 items-center gap-3.5 border-b border-line py-2">
              <Icon className="size-[18px] shrink-0 text-muted" strokeWidth={1.4} aria-hidden="true" />
              <span>{text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// The panel with its own size state, for a piece shown outside its page.
export function HomeBuyPanel(props: Omit<React.ComponentProps<typeof BuyPanel>, "size" | "onSize">) {
  const [size, setSize] = useState("");
  return <BuyPanel {...props} size={size} onSize={setSize} />;
}
