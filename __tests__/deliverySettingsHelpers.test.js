import { fromRestaurant, isUnchanged, parseMoney, summary, toUpdate, validate } from "../helpers/deliverySettings";

describe("reading the restaurant record", () => {
  it("fills the form from ordering", () => {
    expect(fromRestaurant({ ordering: { orderTypes: ["Collection", "Delivery"], deliveryFee: 2.5, freeDeliveryThreshold: 20, minOrder: 10 } }))
      .toEqual({ delivery: true, deliveryFee: "2.5", freeDeliveryThreshold: "20", minOrder: "10" });
  });
  it("copes with missing settings (new restaurant)", () => {
    expect(fromRestaurant({})).toEqual({ delivery: true, deliveryFee: "0", freeDeliveryThreshold: "0", minOrder: "" });
    expect(fromRestaurant({ ordering: { orderTypes: ["Collection"] } }).delivery).toBe(false);
  });
});

describe("parseMoney", () => {
  it("accepts what owners type", () => {
    expect(parseMoney("2.5")).toBe(2.5);
    expect(parseMoney("£2.50")).toBe(2.5);
    expect(parseMoney(" 20 ")).toBe(20);
    expect(parseMoney("")).toBe(0);
    expect(parseMoney("1,000")).toBe(1000);
  });
  it("rejects anything that isn't an amount", () => {
    for (const bad of ["abc", "-1", "2.555", "1e3", "2..5"]) expect(parseMoney(bad)).toBeNaN();
  });
});

describe("validate", () => {
  const ok = { delivery: true, deliveryFee: "2.50", freeDeliveryThreshold: "20", minOrder: "" };
  it("passes sensible values", () => expect(validate(ok)).toEqual({}));
  it("explains bad or silly values", () => {
    expect(validate({ ...ok, deliveryFee: "abc" }).deliveryFee).toMatch(/amount in pounds/);
    expect(validate({ ...ok, deliveryFee: "75" }).deliveryFee).toMatch(/more than £50.00/);
    expect(validate({ ...ok, minOrder: "-5" }).minOrder).toMatch(/amount in pounds/);
  });
  it("ignores delivery fields while delivery is off", () => {
    expect(validate({ ...ok, delivery: false, deliveryFee: "abc" })).toEqual({});
  });
});

describe("toUpdate", () => {
  it("writes only the delivery fields, with Collection always on", () => {
    expect(toUpdate({ delivery: true, deliveryFee: "2.50", freeDeliveryThreshold: "20", minOrder: "10" })).toEqual({
      "ordering.orderTypes": ["Collection", "Delivery"],
      "ordering.deliveryFee": 2.5,
      "ordering.freeDeliveryThreshold": 20,
      "ordering.minOrder": 10,
    });
  });
  it("turning delivery off keeps the fee settings for next time", () => {
    expect(toUpdate({ delivery: false, deliveryFee: "2.50", freeDeliveryThreshold: "20", minOrder: "" })).toEqual({
      "ordering.orderTypes": ["Collection"],
      "ordering.minOrder": 0,
    });
  });
});

describe("summary", () => {
  const base = { delivery: true, deliveryFee: "2.50", freeDeliveryThreshold: "20", minOrder: "" };
  it("says plainly what customers pay", () => {
    expect(summary(base)).toBe("Customers pay £2.50 delivery on orders under £20.00; delivery is free from £20.00.");
    expect(summary({ ...base, deliveryFee: "0" })).toBe("Delivery is free on every order.");
    expect(summary({ ...base, minOrder: "10" })).toMatch(/Minimum order £10.00\.$/);
    expect(summary({ ...base, delivery: false })).toMatch(/^Collection only/);
  });
  it("warns that a threshold of 0 means the fee is never charged", () => {
    expect(summary({ ...base, freeDeliveryThreshold: "0" })).toMatch(/always free: the £2.50 fee is never charged/);
  });
});

it("treats '2.5' and '2.50' as the same value", () => {
  const a = { delivery: true, deliveryFee: "2.5", freeDeliveryThreshold: "20", minOrder: "" };
  expect(isUnchanged(a, { ...a, deliveryFee: "2.50" })).toBe(true);
  expect(isUnchanged(a, { ...a, deliveryFee: "3" })).toBe(false);
});
