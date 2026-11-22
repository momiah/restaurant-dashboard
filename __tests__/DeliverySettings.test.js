import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "styled-components/native";
import DeliverySettings from "../screens/DeliverySettings";
import { buildTheme } from "../theme/defaultTheme";

const mockUpdateDoc = jest.fn(() => Promise.resolve());
jest.mock("firebase/firestore", () => ({
  doc: (_db, ...path) => path.join("/"),
  updateDoc: (...a) => mockUpdateDoc(...a),
}));
jest.mock("../config/firebase.config", () => ({ db: {} }));
const mockReload = jest.fn(() => Promise.resolve());
let mockRestaurant;
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ restaurant: mockRestaurant, restaurantId: "demo", reloadRestaurant: mockReload }),
}));

const navigation = { goBack: jest.fn() };
const renderScreen = () =>
  render(
    <ThemeProvider theme={buildTheme({})}>
      <DeliverySettings navigation={navigation} />
    </ThemeProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  mockRestaurant = {
    id: "demo",
    ordering: { orderTypes: ["Collection", "Delivery"], deliveryFee: 2.5, freeDeliveryThreshold: 20, minOrder: 0, deliveryRadiusMiles: 3 },
  };
});

it("shows the current settings and nothing to save yet", async () => {
  await renderScreen();
  expect(screen.getByLabelText("Delivery fee").props.value).toBe("2.5");
  expect(screen.getByLabelText("Free delivery on orders over").props.value).toBe("20");
  expect(screen.getByTestId("delivery-summary")).toHaveTextContent(/Customers pay £2\.50 delivery on orders under £20\.00/);
  expect(screen.getByText("No changes")).toBeTruthy();
});

it("saves a new fee, threshold and minimum to the restaurant record", async () => {
  await renderScreen();
  await fireEvent.changeText(screen.getByLabelText("Delivery fee"), "3");
  await fireEvent.changeText(screen.getByLabelText("Free delivery on orders over"), "25");
  await fireEvent.changeText(screen.getByLabelText("Minimum order (optional)"), "10");
  expect(screen.getByTestId("delivery-summary")).toHaveTextContent(/£3\.00 delivery on orders under £25\.00/);

  await fireEvent.press(screen.getByText("Save delivery settings"));
  await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalled());
  expect(mockUpdateDoc).toHaveBeenCalledWith("restaurants/demo", {
    "ordering.orderTypes": ["Collection", "Delivery"],
    "ordering.deliveryFee": 3,
    "ordering.freeDeliveryThreshold": 25,
    "ordering.minOrder": 10,
  });
  // Never touches the fields only MenuDock may change.
  const update = mockUpdateDoc.mock.calls[0][1];
  expect(Object.keys(update).every((k) => k.startsWith("ordering."))).toBe(true);
  await waitFor(() => expect(mockReload).toHaveBeenCalled());
  expect(navigation.goBack).toHaveBeenCalled();
});

it("turns delivery off, keeping Collection", async () => {
  await renderScreen();
  await fireEvent(screen.getByLabelText("Offer delivery"), "valueChange", false);
  expect(screen.getByTestId("delivery-summary")).toHaveTextContent(/Collection only/);
  await fireEvent.press(screen.getByText("Save delivery settings"));
  await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalled());
  expect(mockUpdateDoc.mock.calls[0][1]).toEqual({ "ordering.orderTypes": ["Collection"], "ordering.minOrder": 0 });
});

it("won't save an invalid amount and says why", async () => {
  await renderScreen();
  await fireEvent.changeText(screen.getByLabelText("Delivery fee"), "two pounds");
  expect(screen.getByText("Delivery fee must be an amount in pounds, like 2.50.")).toBeTruthy();
  await fireEvent.press(screen.getByText("Save delivery settings"));
  expect(mockUpdateDoc).not.toHaveBeenCalled();
});

it("warns when a threshold of 0 would make every delivery free", async () => {
  await renderScreen();
  await fireEvent.changeText(screen.getByLabelText("Free delivery on orders over"), "0");
  expect(screen.getByTestId("delivery-summary")).toHaveTextContent(/the £2\.50 fee is never charged/);
});

it("tells the owner if saving fails", async () => {
  mockUpdateDoc.mockRejectedValueOnce(new Error("Missing or insufficient permissions."));
  await renderScreen();
  await fireEvent.changeText(screen.getByLabelText("Delivery fee"), "4");
  await fireEvent.press(screen.getByText("Save delivery settings"));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Couldn't save", "Missing or insufficient permissions."));
  expect(navigation.goBack).not.toHaveBeenCalled();
});
