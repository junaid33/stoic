import type { Metadata } from "next";

export const metadata: Metadata = { title: "Size guide" };

export default function SizeGuidePage() {
  const rows = [
    ["Hoodie", "Oversized heavyweight fit. Take your usual size for the intended drape, or one down for a closer fit."],
    ["Tees", "Boxy, relaxed fit with dropped shoulders. True to size; size down for a closer cut."],
    ["Long sleeves", "Relaxed fit, true to size."],
  ];
  return (
    <div className="frame">
      <div className="max-w-[720px] pt-10 lg:pt-14">
        <h1 className="display text-[44px] lg:text-[72px]">Size guide</h1>
        <p className="mt-5 text-[15px] leading-[1.6] text-muted">Every piece comes in XS, S, M, L, XL and XXL.</p>
        <dl className="mt-8 border-t border-line">
          {rows.map(([t, d]) => (
            <div key={t} className="border-b border-line py-5">
              <dt className="caps">{t}</dt>
              <dd className="mt-2 text-[14px] leading-[1.6] text-muted">{d}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
