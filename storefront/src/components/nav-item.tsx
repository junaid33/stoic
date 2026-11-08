import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { NavLink } from "@/lib/nav";

// A site link: Next's Link inside the shop, a plain anchor (with a vector
// arrow when it leaves for another site) otherwise.
export function NavItem({ link, className = "", onClick, ...rest }: { link: NavLink; className?: string; onClick?: () => void; "aria-current"?: "page" }) {
  if (/^(https?|mailto):/.test(link.href))
    return (
      <a href={link.href} className={className} {...rest}>
        {link.label}
        {link.external && <ArrowUpRight className="ml-0.5 inline size-[0.9em] align-[-0.1em]" strokeWidth={1.4} aria-hidden="true" />}
      </a>
    );
  return (
    <Link href={link.href} className={className} onClick={onClick} {...rest}>
      {link.label}
    </Link>
  );
}
