// Order-feed helpers, kept pure so they can be unit-tested.

// Only orders Stripe has confirmed reach the kitchen. The website writes the order as
// "pending" before redirecting to checkout, so abandoned baskets stay pending forever.
export const isPaid = (order) => order?.payment_status === "paid";

// Given every order in a snapshot and the set of paid ids already seen (null on the
// first snapshot), return the paid orders, the ones that are newly paid (alarm), and
// the updated seen-set. The first snapshot never counts as "new".
export function newlyPaid(allOrders, seen) {
  const paid = allOrders.filter(isPaid);
  if (seen === null || seen === undefined) {
    return { paid, fresh: [], seen: new Set(paid.map((o) => o.id)) };
  }
  const next = new Set(seen);
  const fresh = paid.filter((o) => !next.has(o.id));
  fresh.forEach((o) => next.add(o.id));
  return { paid, fresh, seen: next };
}

// Kitchen workflow — mirrors docs/ORDER_STATUS.md in restaurant-site and the Firestore
// rules: placed -> preparing -> ready -> completed. Only the wording differs between
// collection and delivery.
export const ORDER_STEPS = ["placed", "preparing", "ready", "completed"];

const isDelivery = (order) => order?.orderType?.toLowerCase() === "delivery";

// Orders paid before the workflow existed were marked "active"; treat them as placed.
export function orderStep(order) {
  return ORDER_STEPS.includes(order?.status) ? order.status : "placed";
}

export const isCompleted = (order) => orderStep(order) === "completed";

// What the kitchen sees in the status column.
export function statusLabel(order) {
  const delivery = isDelivery(order);
  return {
    placed: "New",
    preparing: "Preparing",
    ready: delivery ? "Out for delivery" : "Ready to collect",
    completed: delivery ? "Delivered" : "Collected",
  }[orderStep(order)];
}

// The one button the kitchen taps to move an order on, or null once it's done.
export function nextAction(order) {
  const delivery = isDelivery(order);
  return {
    placed: { status: "preparing", label: "Start preparing" },
    preparing: { status: "ready", label: delivery ? "Send out for delivery" : "Ready for collection" },
    ready: { status: "completed", label: delivery ? "Mark delivered" : "Mark collected" },
    completed: null,
  }[orderStep(order)];
}

// Step back one stage, to undo a mis-tap. Null for a brand-new order.
export function previousStep(order) {
  const i = ORDER_STEPS.indexOf(orderStep(order));
  return i > 0 ? ORDER_STEPS[i - 1] : null;
}

// The number the customer quotes, e.g. "#1004"; older orders fall back to a short id.
export function orderRef(order) {
  if (order?.orderNumber) return `#${order.orderNumber}`;
  return String(order?.id || "").slice(-5).toUpperCase();
}

// Sort key: order number when present, else Stripe's created time.
const sortKey = (order) => Number(order?.orderNumber) || Number(order?.created) || 0;

// Live view is a queue (oldest first); completed/all views show the newest first.
export function ordersForView(orders, view, orderType = "allOrders") {
  const byType =
    orderType === "collection" || orderType === "delivery"
      ? orders.filter((o) => o.orderType?.toLowerCase() === orderType)
      : orders;
  if (view === "liveOrders") {
    return byType.filter((o) => !isCompleted(o)).sort((a, b) => sortKey(a) - sortKey(b));
  }
  const list = view === "completedOrders" ? byType.filter(isCompleted) : [...byType];
  return list.sort((a, b) => sortKey(b) - sortKey(a));
}
