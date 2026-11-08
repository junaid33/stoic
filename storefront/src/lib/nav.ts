// The site's links, shared by the header, the phone menu and the footer.
export type NavLink = { href: string; label: string; external?: boolean };

export const SHOP: NavLink[] = [{ href: "/shop", label: "Shop" }];
export const MAIN: NavLink[] = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
];
export const helpLinks = (contact: string | null): NavLink[] => [
  { href: "/size-guide", label: "Size guide" },
  { href: "/shipping", label: "Shipping & returns" },
  ...(contact ? [{ href: `mailto:${contact}`, label: "Contact" }] : []),
  { href: "/account", label: "Account" },
];
