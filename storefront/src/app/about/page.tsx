import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <div className="frame">
      <div className="max-w-[680px] pt-10 lg:pt-14">
        <h1 className="display text-[44px] lg:text-[72px]">About</h1>
        <p className="mt-6 text-[16px] leading-[1.7] text-muted">
          STOIC is classical sculpture pulled through an old screen: weathered screenprints of antique heads, laurel and four-point stars, in olive, ochre, rust and stone, on washed heavyweight blanks.
        </p>
        <p className="mt-4 text-[16px] leading-[1.7] text-muted">
          Five pieces. Nothing is made until you order: each one is made to order and shipped from the US.
        </p>
        <Link href="/shop" className="btn btn-primary mt-8 w-full md:w-[300px]">
          Shop collection <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
