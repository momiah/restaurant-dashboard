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
