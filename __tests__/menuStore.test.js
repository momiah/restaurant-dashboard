import { categoryIds, mergeMenus, toMenuItem } from "../helpers/menuStore";

jest.mock("../config/firebase.config", () => ({ db: {} }));

const existing = [
  { id: "tacos", category: "Tacos", items: [{ name: "Soft Taco", price: 2.15, imageUrl: "https://cdn/x.jpg", extras: [{ type: "Cheese", price: 0.5 }] }] },
  { id: "drinks", category: "Drinks", items: [{ name: "Pepsi Max", price: 1.2 }] },
];
const draft = [
  { category: "tacos", items: [{ name: "soft taco", description: "", price: 2.5 }, { name: "Fish Taco", description: "Crispy cod", price: 3 }] },
  { category: "Sides", items: [{ name: "Fries", description: "", price: 2 }] },
];

describe("mergeMenus", () => {
  it("add: joins matching categories, skips items already there, appends new categories", () => {
    const { categories, deleted } = mergeMenus(existing, draft, "add");
    expect(deleted).toEqual([]);
    expect(categories.map((c) => c.category)).toEqual(["Tacos", "Drinks", "Sides"]);
    expect(categories[0].items.map((i) => i.name)).toEqual(["Soft Taco", "Fish Taco"]);
    // The existing item (photo, extras, price) is left untouched.
    expect(categories[0].items[0]).toBe(existing[0].items[0]);
    expect(categories[2]).toMatchObject({ id: null, items: [{ name: "Fries", price: 2, extras: [], protein: [] }] });
    expect(existing[0].items).toHaveLength(1); // no mutation
  });

  it("replace: the draft becomes the menu, reusing ids of same-named categories", () => {
    const { categories, deleted } = mergeMenus(existing, draft, "replace");
    expect(categories.map((c) => [c.id, c.category])).toEqual([["tacos", "tacos"], [null, "Sides"]]);
    expect(categories[0].items.map((i) => i.name)).toEqual(["soft taco", "Fish Taco"]);
    expect(deleted).toEqual(["drinks"]);
  });

  it("imported items get the editor's item shape", () => {
    expect(toMenuItem({ name: " Nachos ", description: " Cheesy ", price: "4.5" })).toEqual({ name: "Nachos", description: "Cheesy", price: 4.5, extras: [], protein: [] });
  });
});

describe("categoryIds", () => {
  it("keeps existing ids and never gives two categories the same new id", () => {
    expect(categoryIds([{ id: "tacos", category: "Tacos" }, { id: null, category: "Tacos" }, { id: null, category: "Tacos!" }, { id: null, category: "" }]))
      .toEqual(["tacos", "tacos-2", "tacos-3", "category-4"]);
  });
});
