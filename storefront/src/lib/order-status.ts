import type { FulfillmentStatus } from "./store";

// Where an order is, from Openfront's own order and fulfillment state. Openship
// records tracking on the Openfront order when Printful ships it.
export type StageKey = "placed" | "production" | "shipped" | "canceled";

export function orderStage(order: { status: string; fulfillmentStatus?: FulfillmentStatus }): { key: StageKey; label: string } {
  if (order.status === "canceled") return { key: "canceled", label: "Canceled" };
  const shipping = order.fulfillmentStatus?.shippingStatus;
  if (shipping === "shipped") return { key: "shipped", label: "Shipped" };
  if (shipping === "partially_shipped") return { key: "shipped", label: "Partly shipped" };
  return { key: "production", label: "In production" };
}
