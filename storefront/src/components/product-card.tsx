import Image from "next/image";
import Link from "next/link";
import { money, type Product } from "@/lib/store";

export const priceLine = (product: Product) => money(product.price);

export function ProductCard({ product, priority = false, sizes }: { product: Product; priority?: boolean; sizes: string }) {
  return (
    <Link href={`/products/${product.handle}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#c9c1b2]">
        <Image src={product.image} alt={product.title} fill priority={priority} sizes={sizes} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <p className="caps mt-3">{product.title}</p>
      <p className="caps mt-1 text-muted">{priceLine(product)}</p>
    </Link>
  );
}
