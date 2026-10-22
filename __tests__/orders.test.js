import { isPaid, newlyPaid } from "../helpers/orders";

const order = (id, payment_status = "paid", extra = {}) => ({ id, payment_status, ...extra });

describe("isPaid", () => {
  it("only lets Stripe-confirmed orders through", () => {
    expect(isPaid(order("a", "paid"))).toBe(true);
    expect(isPaid(order("b", "pending"))).toBe(false); // abandoned checkout
    expect(isPaid(order("c", "unpaid"))).toBe(false);
    expect(isPaid({})).toBe(false);
    expect(isPaid(undefined)).toBe(false);
  });
});

describe("newlyPaid (kitchen alarm)", () => {
  it("never alarms for orders that already existed when the app opened", () => {
    const { paid, fresh, seen } = newlyPaid([order("1"), order("2"), order("3", "pending")], null);
    expect(paid.map((o) => o.id)).toEqual(["1", "2"]);
    expect(fresh).toEqual([]);
    expect([...seen]).toEqual(["1", "2"]);
  });

  it("alarms when an order arrives already paid", () => {
    const first = newlyPaid([order("1")], null);
    const next = newlyPaid([order("1"), order("2")], first.seen);
    expect(next.fresh.map((o) => o.id)).toEqual(["2"]);
  });

  it("alarms when a pending order becomes paid (Stripe webhook update)", () => {
    const first = newlyPaid([order("1", "pending")], null);
    expect(first.paid).toEqual([]);
    const afterWebhook = newlyPaid([order("1", "paid")], first.seen);
    expect(afterWebhook.fresh.map((o) => o.id)).toEqual(["1"]);
  });

  it("does not alarm again when a known paid order is merely updated", () => {
    const first = newlyPaid([order("1")], null);
    const updated = newlyPaid([order("1", "paid", { status: "completed" })], first.seen);
    expect(updated.fresh).toEqual([]);
  });

  it("does not mutate the previous seen-set", () => {
    const first = newlyPaid([order("1")], null);
    newlyPaid([order("1"), order("2")], first.seen);
    expect([...first.seen]).toEqual(["1"]);
  });
});
