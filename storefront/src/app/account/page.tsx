import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { SignInForm } from "@/components/sign-in-form";
import { signOut } from "@/lib/actions";
import { getCustomer, getOrders } from "@/lib/store";
import { orderStage } from "@/lib/order-status";

export const metadata: Metadata = { title: "Account" };

const date = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function AccountPage() {
  const customer = await getCustomer();
  if (!customer)
    return (
      <div className="frame">
        <div className="max-w-[480px] pt-10 lg:pt-14">
          <h1 className="display t-title">Account</h1>
          <p className="mt-5 text-[15px] leading-[1.5] text-muted">Sign in to see your orders and their tracking.</p>
          <SignInForm />
          <p className="mt-10 border-t border-line pt-6 text-[13px] leading-[1.5] text-muted">
            Checked out as a guest? Your order has its own page, opened right after you pay. Bookmark it to check on production and tracking.
          </p>
        </div>
      </div>
    );
  const orders = await getOrders();
  return (
    <div className="frame">
      <div className="max-w-[744px] pt-10 lg:pt-14">
        <h1 className="display t-title">Account</h1>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y-2 border-ink py-6">
          <div>
            <p className="text-[15px] font-semibold">{customer.name || customer.email}</p>
            <p className="mt-1 text-[13px] text-muted">{customer.email}</p>
            {customer.tradeAccount && <p className="mt-3 text-[13px]">Trade account active: you can order on account at checkout.</p>}
          </div>
          <form action={signOut}>
            <button type="submit" className="btn btn-line">
              Sign out
            </button>
          </form>
        </div>
        <h2 className="display t-sub mt-12">Your orders</h2>
        {orders.length === 0 ? (
          <div className="mt-6 border-t border-line pt-8">
            <p className="text-[15px] text-muted">No orders yet.</p>
            <Link href="/shop" className="btn btn-primary mt-6 w-full md:w-[330px]">
              Shop all
              <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <ul className="mt-6 border-y border-line rule-list">
            {orders.map((order) => (
              <li key={order.id}>
                <Link href={`/order/${order.id}`} className="flex min-h-16 items-center gap-4 py-4 hover:text-muted">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px]">
                      <span className="font-semibold">#{order.displayId}</span>
                      <span className="ml-3 text-muted">{date(order.createdAt)}</span>
                    </p>
                    <p className="mt-1 truncate text-[13px] text-muted">{order.lineItems.map((l) => `${l.quantity} x ${l.title}`).join(", ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px]">{order.total}</p>
                    <p className="text-[12px] text-muted">{orderStage(order).label}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted" strokeWidth={1.4} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
