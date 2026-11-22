// Delivery settings an owner controls from the tablet: whether delivery is offered,
// the delivery fee, the free-delivery threshold and an optional minimum order.
// They live on the restaurant record under `ordering`, which the checkout function
// reads when it prices an order (restaurant-site functions/checkout.js):
//   - deliveryFee: charged on delivery orders; £0 means delivery is free.
//   - freeDeliveryThreshold: orders of at least this much deliver free; 0 means
//     delivery is always free (the fee is never charged).
//   - minOrder: the smallest order accepted, for collection and delivery; 0 = none.
// Collection is always offered.

export const LIMITS = { deliveryFee: 50, freeDeliveryThreshold: 1000, minOrder: 1000 };

const money = (n) => `£${Number(n).toFixed(2)}`;
const asText = (n) => (n === undefined || n === null || n === "" ? "" : String(n));

// Form values (strings, as typed) from the restaurant record.
export function fromRestaurant(restaurant) {
  const ordering = restaurant?.ordering || {};
  const types = Array.isArray(ordering.orderTypes) ? ordering.orderTypes : ["Collection", "Delivery"];
  return {
    delivery: types.includes("Delivery"),
    deliveryFee: asText(ordering.deliveryFee ?? 0),
    freeDeliveryThreshold: asText(ordering.freeDeliveryThreshold ?? 0),
    minOrder: ordering.minOrder ? asText(ordering.minOrder) : "",
  };
}

// "2.5", "£2.50", " 2 " → 2.5. Blank → 0. Anything else → NaN.
export function parseMoney(text) {
  const cleaned = String(text ?? "").replace(/[£,\s]/g, "");
  if (cleaned === "") return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

// Problems keyed by field, in words for the owner. Empty object = valid.
export function validate(values) {
  const errors = {};
  const check = (field, label) => {
    const n = parseMoney(values[field]);
    if (Number.isNaN(n)) errors[field] = `${label} must be an amount in pounds, like 2.50.`;
    else if (n > LIMITS[field]) errors[field] = `${label} can't be more than ${money(LIMITS[field])}.`;
  };
  if (values.delivery) {
    check("deliveryFee", "Delivery fee");
    check("freeDeliveryThreshold", "Free delivery threshold");
  }
  check("minOrder", "Minimum order");
  return errors;
}

// Firestore update for restaurants/{id}. Dotted paths change only these fields,
// leaving the rest of `ordering` (radius, postcodes, address…) untouched. When
// delivery is off, the fee settings are kept as they were for next time.
export function toUpdate(values) {
  const update = {
    "ordering.orderTypes": values.delivery ? ["Collection", "Delivery"] : ["Collection"],
    "ordering.minOrder": parseMoney(values.minOrder),
  };
  if (values.delivery) {
    update["ordering.deliveryFee"] = parseMoney(values.deliveryFee);
    update["ordering.freeDeliveryThreshold"] = parseMoney(values.freeDeliveryThreshold);
  }
  return update;
}

// What customers will see, in one or two sentences, so the effect of the numbers
// is obvious (in particular that a threshold of 0 makes every delivery free).
export function summary(values) {
  const min = parseMoney(values.minOrder);
  const minText = min > 0 ? ` Minimum order ${money(min)}.` : "";
  if (!values.delivery) return `Collection only: customers can't choose delivery.${minText}`;
  const fee = parseMoney(values.deliveryFee);
  const threshold = parseMoney(values.freeDeliveryThreshold);
  if (Number.isNaN(fee) || Number.isNaN(threshold)) return "";
  let text;
  if (fee === 0) text = "Delivery is free on every order.";
  else if (threshold === 0) text = `Delivery is always free: the ${money(fee)} fee is never charged. Set a free delivery threshold to charge it.`;
  else text = `Customers pay ${money(fee)} delivery on orders under ${money(threshold)}; delivery is free from ${money(threshold)}.`;
  return text + minText;
}

export const isUnchanged = (a, b) => JSON.stringify(toUpdate(a)) === JSON.stringify(toUpdate(b));
