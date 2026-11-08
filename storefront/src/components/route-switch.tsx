"use client";

import { usePathname } from "next/navigation";

// Renders `checkout` on the checkout page and `children` everywhere else.
export function ForCheckout({ checkout, children }: { checkout: React.ReactNode; children: React.ReactNode }) {
  return usePathname() === "/checkout" ? checkout : children;
}
