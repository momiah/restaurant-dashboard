import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "styled-components/native";
import MenuImport from "../screens/MenuImport";
import { buildTheme } from "../theme/defaultTheme";

jest.mock("../context/AuthContext", () => ({ useAuth: () => ({ restaurantId: "taco-monster" }) }));
const mockPick = jest.fn();
const mockImport = jest.fn();
jest.mock("../helpers/menuImport", () => ({
  pickMenuFile: (...a) => mockPick(...a),
  importMenuFile: (...a) => mockImport(...a),
  importErrorMessage: (e) => e.message,
}));
const mockSave = jest.fn(() => Promise.resolve());
jest.mock("../helpers/menuStore", () => ({
  ...jest.requireActual("../helpers/menuStore"),
  loadMenu: () => Promise.resolve([{ id: "drinks", category: "Drinks", items: [{ name: "Pepsi Max", price: 1.2 }] }]),
  saveMenu: (...a) => mockSave(...a),
}));
jest.mock("../config/firebase.config", () => ({ db: {} }));

const draft = {
  categories: [{ category: "Tacos", items: [{ name: "Soft Taco", description: "Beef", price: 2.15 }, { name: "Fish Taco", description: "", price: null }] }],
  warnings: ["Fish Taco had no price."],
};
const navigation = { goBack: jest.fn() };
const renderImport = () =>
  render(
    <ThemeProvider theme={buildTheme({})}>
      <MenuImport navigation={navigation} />
    </ThemeProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  mockPick.mockResolvedValue({ uri: "file:///m.pdf", name: "menu.pdf", contentType: "application/pdf" });
  mockImport.mockResolvedValue(draft);
});

it("previews the scanned menu and won't save until every item has a price", async () => {
  await renderImport();
  await fireEvent.press(screen.getByText("Upload a file"));
  expect(await screen.findByText("Check your menu")).toBeTruthy();
  expect(mockPick).toHaveBeenCalledWith("file");
  expect(screen.getByDisplayValue("Soft Taco")).toBeTruthy();
  expect(screen.getByText("• Fish Taco had no price.")).toBeTruthy();
  expect(screen.getByText("1 item has no price — add one, or remove the item.")).toBeTruthy();

  await fireEvent.press(screen.getByText("Add to my menu"));
  expect(mockSave).not.toHaveBeenCalled();

  await fireEvent.changeText(screen.getByLabelText("Price of Fish Taco"), "3.50");
  expect(screen.queryByText(/has no price/)).toBeNull();
});

it("adds the edited items to the existing menu", async () => {
  await renderImport();
  await fireEvent.press(screen.getByText("Take a photo"));
  await screen.findByText("Check your menu");
  await fireEvent.changeText(screen.getByDisplayValue("Soft Taco"), "Soft Beef Taco");
  await fireEvent.press(screen.getByLabelText("Remove Fish Taco"));
  await fireEvent.press(screen.getByText("Add to my menu"));

  await waitFor(() => expect(mockSave).toHaveBeenCalled());
  const [restaurantId, categories, deleted] = mockSave.mock.calls[0];
  expect(restaurantId).toBe("taco-monster");
  expect(categories.map((c) => c.category)).toEqual(["Drinks", "Tacos"]);
  expect(categories[1].items).toEqual([{ name: "Soft Beef Taco", description: "Beef", price: 2.15, extras: [], protein: [] }]);
  expect(deleted).toEqual([]);
  expect(navigation.goBack).toHaveBeenCalled();
});

it("asks before replacing the whole menu", async () => {
  mockImport.mockResolvedValue({ categories: [draft.categories[0]].map((c) => ({ ...c, items: [c.items[0]] })), warnings: [] });
  await renderImport();
  await fireEvent.press(screen.getByText("Upload a file"));
  await screen.findByText("Check your menu");
  await fireEvent.press(screen.getByText("Replace my menu"));

  expect(mockSave).not.toHaveBeenCalled();
  const [title, , buttons] = Alert.alert.mock.calls[0];
  expect(title).toBe("Replace your whole menu?");
  await buttons.find((b) => b.text === "Replace").onPress();
  await waitFor(() => expect(mockSave).toHaveBeenCalled());
  const [, categories, deleted] = mockSave.mock.calls[0];
  expect(categories.map((c) => c.category)).toEqual(["Tacos"]);
  expect(deleted).toEqual(["drinks"]);
});

it("explains a failed read and lets the owner try again", async () => {
  mockImport.mockRejectedValue(new Error("That file is empty."));
  await renderImport();
  await fireEvent.press(screen.getByText("Upload a file"));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Couldn't read that menu", "That file is empty."));
  expect(screen.getByText("Take a photo")).toBeTruthy();
});
