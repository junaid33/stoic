import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductView } from "@/components/product-view";
import { getProduct, listProducts } from "@/lib/store";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).handle).catch(() => null);
  return product ? { title: product.title, description: product.blurb, openGraph: { images: [product.image] } } : {};
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();
  const all = await listProducts().catch(() => []);
  const related = all.filter((p) => p.id !== product.id).slice(0, 4);
  return (
    <div className="bone">
      <div className="frame pb-16">
        <ProductView
          title={product.title}
          price={product.price}
          blurb={product.blurb}
          bullets={product.bullets}
          photos={product.photos}
          photosByColour={product.photosByColour}
          colours={product.colours}
          sizes={product.sizes}
          variants={product.variants}
        />
        {related.length > 0 && (
          <section aria-labelledby="more" className="mt-20">
            <h2 id="more" className="display border-b border-line pb-4 text-[28px]">More from the collection</h2>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} sizes="(min-width: 768px) 23vw, 46vw" />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
