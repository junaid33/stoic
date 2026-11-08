import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/marks";
import { NavItem } from "@/components/nav-item";
import { helpLinks, MAIN } from "@/lib/nav";

export function SiteFooter({ contact }: { contact: string | null }) {
  return (
    <footer className="mt-24 border-t border-line lg:mt-32">
      <div className="frame">
        <div className="grid gap-y-10 pb-10 pt-12 lg:grid-cols-[1fr_200px_200px] lg:pt-16">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-[34ch] text-[14px] text-muted">Classical sculpture, screenprinted on heavyweight garment-dyed blanks. Made to order and shipped from the US.</p>
          </div>
          {[["Shop", MAIN], ["Help", helpLinks(contact)]].map(([title, links]) => (
            <div key={title as string}>
              <h2 className="caps text-faint">{title as string}</h2>
              <ul className="mt-3 text-[14px]">
                {(links as typeof MAIN).map((link) => (
                  <li key={link.href + link.label}>
                    <NavItem link={link} className="inline-flex min-h-11 min-w-11 items-center text-muted transition-colors hover:text-ink" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line py-5 text-[12px] text-faint">
          <p>&copy; {new Date().getFullYear()} STOIC</p>
          <p>United States &middot; USD</p>
        </div>
      </div>
    </footer>
  );
}

export function CheckoutFooter() {
  return (
    <footer className="frame mt-20">
      <div className="flex flex-wrap items-center justify-between gap-x-6 border-t border-line py-4 text-[12px] text-muted">
        <Link href="/cart" className="inline-flex min-h-11 items-center gap-1.5 hover:text-ink">
          <ArrowLeft className="size-3" strokeWidth={1.4} aria-hidden="true" /> Return to cart
        </Link>
        <Link href="/shipping" className="inline-flex min-h-11 items-center hover:text-ink">
          Shipping &amp; returns
        </Link>
      </div>
    </footer>
  );
}
