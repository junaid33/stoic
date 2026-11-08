"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/marks";
import { NavItem } from "@/components/nav-item";
import { useSheet } from "@/components/sheet";
import { MAIN } from "@/lib/nav";

const bagLabel = (count: number) => `Cart, ${count} item${count === 1 ? "" : "s"}`;

// Home floats over the hero; every other page keeps the black bar. Checkout keeps only the wordmark.
export function SiteHeader({ count }: { count: number; contact: string | null }) {
  const pathname = usePathname();
  const menu = useSheet();
  const { close } = menu;
  useEffect(() => close(), [pathname, close]);
  const checkout = pathname === "/checkout";
  const home = pathname === "/";
  const bone = pathname.startsWith("/products/");

  const cart = (
    <Link href="/cart" aria-label={bagLabel(count)} className="caps flex min-h-11 min-w-11 items-center justify-end">
      Cart ({count})
    </Link>
  );
  return (
    <header className={`${home ? "absolute inset-x-0 top-0 z-40" : `sticky top-0 z-40 border-b border-line backdrop-blur-md ${bone ? "bone bg-[#d9d2c4]/90" : "bg-paper/90"}`}`}>
      <div className="frame">
        <div className="grid h-16 grid-cols-[1fr_auto] items-center gap-4 lg:h-[72px]">
          <div className="flex items-center gap-10">
            {!home && (
              <Link href="/" aria-label="STOIC, home" className="flex min-h-11 items-center">
                <Wordmark />
              </Link>
            )}
            {!checkout && (
              <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
                {MAIN.map((link) => (
                  <NavItem key={link.href} link={link} className="caps flex min-h-11 items-center hover:opacity-70" />
                ))}
              </nav>
            )}
          </div>
          {checkout ? (
            <p className="caps justify-self-end">Secure checkout</p>
          ) : (
            <div className="flex items-center justify-self-end">
              <button type="button" onClick={menu.open} aria-label="Open menu" aria-haspopup="dialog" className="caps mr-5 flex min-h-11 items-center md:hidden">
                Menu
              </button>
              {cart}
            </div>
          )}
        </div>
      </div>
      <dialog {...menu.props} aria-label="Menu" className="sheet md:hidden">
        <div className="frame min-h-full pb-12">
          <div className="flex h-16 items-center justify-between">
            <Wordmark />
            <button type="button" onClick={menu.close} aria-label="Close menu" className="caps flex min-h-11 items-center">
              Close
            </button>
          </div>
          <ul className="mt-6 border-t border-line">
            {[...MAIN, { href: "/cart", label: "Cart" }, { href: "/account", label: "Account" }].map((row) => (
              <li key={row.href} className="border-b border-line">
                <Link href={row.href} onClick={menu.close} className="display flex min-h-[64px] items-center text-[30px]">
                  {row.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </header>
  );
}
