import {
  isPaid,
  newlyPaid,
  nextAction,
  orderRef,
  orderStep,
  ordersForView,
  previousStep,
  statusLabel,
} from "../helpers/orders";

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

describe("kitchen workflow", () => {
  const collection = (status) => order("c", "paid", { orderType: "Collection", status });
  const delivery = (status) => order("d", "paid", { orderType: "Delivery", status });

  it("walks a collection order to collected", () => {
    expect(nextAction(collection("placed"))).toEqual({ status: "preparing", label: "Start preparing" });
    expect(nextAction(collection("preparing"))).toEqual({ status: "ready", label: "Ready for collection" });
    expect(nextAction(collection("ready"))).toEqual({ status: "completed", label: "Mark collected" });
    expect(nextAction(collection("completed"))).toBeNull();
    expect(statusLabel(collection("ready"))).toBe("Ready to collect");
  });

  it("walks a delivery order to delivered", () => {
    expect(nextAction(delivery("preparing")).label).toBe("Send out for delivery");
    expect(statusLabel(delivery("ready"))).toBe("Out for delivery");
    expect(nextAction(delivery("ready")).label).toBe("Mark delivered");
    expect(statusLabel(delivery("completed"))).toBe("Delivered");
  });

  it("treats legacy 'active' and missing statuses as a new order", () => {
    expect(orderStep(collection("active"))).toBe("placed");
    expect(orderStep(collection(undefined))).toBe("placed");
    expect(statusLabel(collection("active"))).toBe("New");
  });

  it("undo steps back one stage, never before placed", () => {
    expect(previousStep(collection("ready"))).toBe("preparing");
    expect(previousStep(collection("completed"))).toBe("ready");
    expect(previousStep(collection("placed"))).toBeNull();
  });

  it("shows the customer's order number, or a short id for older orders", () => {
    expect(orderRef({ id: "cs_test_x", orderNumber: 1004 })).toBe("#1004");
    expect(orderRef({ id: "cs_test_abcde" })).toBe("ABCDE");
  });
});

describe("ordersForView", () => {
  const all = [
    order("a", "paid", { orderNumber: 1001, status: "completed", orderType: "Collection" }),
    order("b", "paid", { orderNumber: 1003, status: "placed", orderType: "Delivery" }),
    order("c", "paid", { orderNumber: 1002, status: "preparing", orderType: "Collection" }),
  ];
  const ids = (list) => list.map((o) => o.id);

  it("live orders are a queue, oldest first, without finished ones", () => {
    expect(ids(ordersForView(all, "liveOrders"))).toEqual(["c", "b"]);
  });
  it("completed and all-orders views show the newest first", () => {
    expect(ids(ordersForView(all, "completedOrders"))).toEqual(["a"]);
    expect(ids(ordersForView(all, "allOrders"))).toEqual(["b", "c", "a"]);
  });
  it("combines with the collection/delivery filter", () => {
    expect(ids(ordersForView(all, "liveOrders", "delivery"))).toEqual(["b"]);
    expect(ids(ordersForView(all, "allOrders", "collection"))).toEqual(["c", "a"]);
  });
  it("does not mutate the feed", () => {
    const copy = [...all];
    ordersForView(all, "allOrders");
    expect(all).toEqual(copy);
  });
});
