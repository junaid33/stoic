import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Inter } from "next/font/google";
import { ForCheckout } from "@/components/route-switch";
import { CheckoutFooter, SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { cartCount, getCart } from "@/lib/store";
import "./globals.css";

// A high-contrast Didone for the wordmark and titles; a quiet sans for the rest.
const didone = Bodoni_Moda({ subsets: ["latin"], variable: "--font-didone", display: "swap", axes: ["opsz"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans-ui", display: "swap" });

export const metadata: Metadata = {
  title: { default: "STOIC", template: "%s | STOIC" },
  description: "Classical sculpture, screenprinted on heavyweight garment-dyed hoodies, tees and long sleeves. Made to order.",
};
export const viewport: Viewport = { themeColor: "#0e0d0c" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const count = cartCount(await getCart());
  const contact = process.env.SUPPORT_EMAIL || null;
  return (
    <html lang="en" className={`${didone.variable} ${sans.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:text-paper">
          Skip to content
        </a>
        <SiteHeader count={count} contact={contact} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <ForCheckout checkout={<CheckoutFooter />}>
          <SiteFooter contact={contact} />
        </ForCheckout>
      </body>
    </html>
  );
}
