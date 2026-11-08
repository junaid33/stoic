import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="frame">
      <div className="pt-10 lg:pt-14">
        <h1 className="display t-title">Not found</h1>
        <p className="mt-5 text-[15px] text-muted">
          This page does not exist. <span className="num text-[12px]">404</span>
        </p>
        <Link href="/shop" className="btn btn-primary mt-8 w-full md:w-[300px]">
          Shop all
          <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
