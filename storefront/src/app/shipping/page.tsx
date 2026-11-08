import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

export const metadata: Metadata = { title: "Shipping and returns" };

export default async function ShippingPage() {
  // Read at request time so the owner can set it on Railway without a rebuild.
  await connection();
  const email = process.env.SUPPORT_EMAIL || null;
  const sections = [
    ["made", "Made to order", "Nothing is made until you order. Printful prints each piece direct to garment, usually within 2 to 5 business days, then ships it from its US facilities."],
    ["shipping", "Shipping", "We ship to US addresses for a flat $8 per order. Your order page shows tracking as soon as the parcel leaves."],
    ["returns", "Returns", "Because every piece is made for you, we cannot take returns for a change of mind or the wrong size; the size guide gives the exact measurements. If something arrives misprinted, damaged or wrong, tell us within 30 days of delivery with your order number and a photo, and we will remake it or refund you."],
    ["care", "Care", "Wash cold and inside out, then hang dry or tumble dry low. Do not iron over the print."],
  ];
  return (
    <div className="frame">
      <div className="max-w-[760px] pt-10 lg:pt-14">
        <h1 className="display t-title">Shipping &amp; returns</h1>
        <div className="mt-10">
          {sections.map(([id, title, text]) => (
            <section key={id} id={id} aria-labelledby={`${id}-title`} className="border-t border-line py-7">
              <h2 id={`${id}-title`} className="display t-sub">
                {title}
              </h2>
              <p className="mt-4 text-[15px] leading-[1.5] text-muted">{text}</p>
              {id === "returns" && (
                <p className="mt-3 text-[15px] leading-[1.5] text-muted">
                  {email ? (
                    <>
                      Write to{" "}
                      <a href={`mailto:${email}`} className="link text-ink">
                        {email}
                      </a>
                      .{" "}
                    </>
                  ) : null}
                  <Link href="/size-guide" className="link text-ink">
                    Size guide
                  </Link>
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
