// Reading and writing a restaurant's menu: restaurants/{id}/menu, one document per
// category ({ category, order, items }). Shared by the menu editor and menu import.
import { collection, doc, getDocs, orderBy, query, writeBatch } from "firebase/firestore";
import { db } from "../config/firebase.config";

export const slugify = (s) =>
  (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function loadMenu(restaurantId) {
  const ref = collection(db, "restaurants", restaurantId, "menu");
  let snap;
  try {
    snap = await getDocs(query(ref, orderBy("order")));
  } catch {
    snap = await getDocs(ref);
  }
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, category: data.category || d.id, items: data.items || [] };
  });
}

// Doc ids for each category: keep existing ids, slug new ones, and never let two
// categories share an id (that would silently overwrite one of them).
export function categoryIds(categories) {
  const used = new Set(categories.map((c) => c.id).filter(Boolean));
  return categories.map((cat, idx) => {
    if (cat.id) return cat.id;
    const base = slugify(cat.category) || `category-${idx + 1}`;
    let id = base;
    for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
    used.add(id);
    return id;
  });
}

// Writes the whole menu in one batch, in display order, and removes deleted categories.
export async function saveMenu(restaurantId, categories, deletedIds = []) {
  const ids = categoryIds(categories);
  const batch = writeBatch(db);
  categories.forEach((cat, idx) => {
    batch.set(doc(db, "restaurants", restaurantId, "menu", ids[idx]), {
      category: (cat.category || "").trim() || "Menu",
      order: idx + 1,
      items: cat.items,
    });
  });
  deletedIds
    .filter((id) => !ids.includes(id))
    .forEach((id) => batch.delete(doc(db, "restaurants", restaurantId, "menu", id)));
  await batch.commit();
}

const sameName = (a, b) => (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

// Imported items get the same shape as items made in the editor.
export const toMenuItem = ({ name, description, price }) => ({
  name: (name || "").trim(),
  description: (description || "").trim(),
  price: Number(price) || 0,
  extras: [],
  protein: [],
});

// Combines an imported draft with the current menu.
//  - "replace": the draft becomes the menu (categories with the same name keep their
//    id, so links/order stay stable); every other existing category is deleted.
//  - "add": draft items join categories with the same name (skipping items already
//    there by name); new categories go at the end. Nothing is removed.
export function mergeMenus(existing, draft, mode) {
  const drafted = draft.map((cat) => ({ category: cat.category, items: cat.items.map(toMenuItem) }));
  if (mode === "replace") {
    const kept = new Set();
    const categories = drafted.map((cat) => {
      const match = existing.find((e) => sameName(e.category, cat.category) && !kept.has(e.id));
      if (match) kept.add(match.id);
      return { id: match ? match.id : null, ...cat };
    });
    return { categories, deleted: existing.map((e) => e.id).filter((id) => !kept.has(id)) };
  }
  const categories = existing.map((e) => ({ ...e, items: [...e.items] }));
  for (const cat of drafted) {
    const target = categories.find((c) => sameName(c.category, cat.category));
    if (!target) {
      categories.push({ id: null, ...cat });
      continue;
    }
    for (const item of cat.items) {
      if (!target.items.some((i) => sameName(i.name, item.name))) target.items.push(item);
    }
  }
  return { categories, deleted: [] };
}
