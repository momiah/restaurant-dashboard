import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "styled-components/native";
import MenuEditor from "../screens/MenuEditor";
import { buildTheme } from "../theme/defaultTheme";

// --- Firestore fake: records exactly what the editor writes -----------------------
const mockBatch = { set: jest.fn(), delete: jest.fn(), commit: jest.fn(() => Promise.resolve()) };
let mockMenuDocs = [];
jest.mock("firebase/firestore", () => ({
  collection: (_db, ...path) => ({ path: path.join("/") }),
  query: (ref) => ref,
  orderBy: () => ({}),
  getDocs: jest.fn(() => Promise.resolve({ docs: mockMenuDocs })),
  doc: (_db, ...path) => path.join("/"),
  writeBatch: () => mockBatch,
}));
jest.mock("../config/firebase.config", () => ({ db: {} }));
jest.mock("../context/AuthContext", () => ({ useAuth: () => ({ restaurantId: "taco-monster" }) }));

const tacos = {
  id: "tacos",
  data: () => ({
    category: "Tacos",
    order: 1,
    items: [{ name: "Soft Taco", price: 2.15, description: "Protein, lettuce", extras: [{ type: "Sour Cream", price: 0.4 }], protein: [{ type: "Beef", price: null }] }],
  }),
};

const renderEditor = () =>
  render(
    <ThemeProvider theme={buildTheme({})}>
      <MenuEditor />
    </ThemeProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockMenuDocs = [tacos];
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

it("loads the restaurant's menu, with nothing to save yet", async () => {
  await renderEditor();
  expect(await screen.findByText("Soft Taco")).toBeTruthy();
  expect(screen.getByText("£2.15")).toBeTruthy();
  expect(screen.getByText("All changes saved")).toBeTruthy();
});

it("adds an item and saves it to restaurants/{id}/menu, keeping existing item data", async () => {
  await renderEditor();
  await screen.findByText("Soft Taco");

  await fireEvent.press(screen.getByText("+ Add item"));
  await fireEvent.changeText(screen.getByPlaceholderText("e.g. Soft Taco"), "Crunchy Taco");
  await fireEvent.changeText(screen.getByPlaceholderText("2.15"), "2.50");
  await fireEvent.changeText(screen.getByPlaceholderText("Short description"), "Crispy shell");
  await fireEvent.press(screen.getByText("Done"));

  expect(screen.getByText("Crunchy Taco")).toBeTruthy();
  await fireEvent.press(screen.getByText("Save changes"));

  await waitFor(() => expect(mockBatch.commit).toHaveBeenCalledTimes(1));
  expect(mockBatch.set).toHaveBeenCalledTimes(1);
  const [path, payload] = mockBatch.set.mock.calls[0];
  expect(path).toBe("restaurants/taco-monster/menu/tacos");
  expect(payload.category).toBe("Tacos");
  expect(payload.order).toBe(1);
  // Existing item untouched — extras/protein the website relies on are preserved.
  expect(payload.items[0]).toEqual(tacos.data().items[0]);
  // New item: numeric price (website calls price.toFixed) + empty option lists.
  expect(payload.items[1]).toEqual({ name: "Crunchy Taco", price: 2.5, description: "Crispy shell", extras: [], protein: [] });
  expect(Alert.alert).toHaveBeenCalledWith("Saved", expect.any(String));
  expect(await screen.findByText("All changes saved")).toBeTruthy();
});

it("editing a price keeps the item's extras and protein options", async () => {
  await renderEditor();
  await fireEvent.press(await screen.findByText("Soft Taco"));
  await fireEvent.changeText(screen.getByDisplayValue("2.15"), "2.95");
  await fireEvent.press(screen.getByText("Done"));
  await fireEvent.press(screen.getByText("Save changes"));

  await waitFor(() => expect(mockBatch.commit).toHaveBeenCalled());
  const [, payload] = mockBatch.set.mock.calls[0];
  expect(payload.items[0]).toMatchObject({ name: "Soft Taco", price: 2.95, extras: [{ type: "Sour Cream", price: 0.4 }], protein: [{ type: "Beef", price: null }] });
});

it("adds a new category, saved under a slug id after existing ones", async () => {
  await renderEditor();
  await screen.findByText("Soft Taco");
  await fireEvent.press(screen.getByText("+ Add category"));
  await fireEvent.changeText(screen.getByDisplayValue("New category"), "Hot Drinks");
  await fireEvent.press(screen.getByText("Save changes"));

  await waitFor(() => expect(mockBatch.commit).toHaveBeenCalled());
  expect(mockBatch.set).toHaveBeenCalledWith("restaurants/taco-monster/menu/hot-drinks", { category: "Hot Drinks", order: 2, items: [] });
});

it("deleting a category (after confirming) removes its document", async () => {
  // Auto-confirm the "Delete category?" dialog.
  Alert.alert.mockImplementation((_t, _m, buttons) => buttons?.find((b) => b.text === "Delete")?.onPress());
  await renderEditor();
  await screen.findByText("Soft Taco");
  await fireEvent.press(screen.getByText("✕"));
  await fireEvent.press(screen.getByText("Save changes"));

  await waitFor(() => expect(mockBatch.commit).toHaveBeenCalled());
  expect(mockBatch.delete).toHaveBeenCalledWith("restaurants/taco-monster/menu/tacos");
  expect(mockBatch.set).not.toHaveBeenCalled();
});

it("shows an empty state when the restaurant has no menu yet", async () => {
  mockMenuDocs = [];
  await renderEditor();
  expect(await screen.findByText("No menu yet. Add your first category below.")).toBeTruthy();
});
