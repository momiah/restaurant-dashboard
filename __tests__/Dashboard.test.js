import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { ThemeProvider } from "styled-components/native";
import Dashboard from "../screens/Dashboard";
import { buildTheme } from "../theme/defaultTheme";

// --- Firestore fake: a live order feed we can push snapshots into ------------------
let mockEmit;
const mockUpdateDoc = jest.fn(() => Promise.resolve());
jest.mock("firebase/firestore", () => ({
  collection: (_db, ...path) => ({ path: path.join("/") }),
  query: (ref) => ref,
  where: () => ({}),
  doc: (_db, ...path) => path.join("/"),
  onSnapshot: (_q, next) => {
    mockEmit = next;
    return () => {};
  },
  updateDoc: (...args) => mockUpdateDoc(...args),
  serverTimestamp: () => "SERVER_TIME",
}));
jest.mock("../config/firebase.config", () => ({ db: {} }));
jest.mock("../context/AuthContext", () => ({ useAuth: () => ({ restaurantId: "taco-monster" }) }));

const feed = (orders) => ({ docs: orders.map(({ id, ...data }) => ({ id, data: () => data })) });
const paid = (id, extra) => ({ id, payment_status: "paid", restaurantId: "taco-monster", total: 10, ...extra });

const renderDashboard = () =>
  render(
    <ThemeProvider theme={buildTheme({})}>
      <Dashboard navigation={{ navigate: jest.fn() }} filter="allOrders" />
    </ThemeProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

it("shows live paid orders by number with the next step to take", async () => {
  await renderDashboard();
  await act(() =>
    mockEmit(
      feed([
        paid("cs_1", { orderNumber: 1001, status: "placed", orderType: "Collection", name: "Ann" }),
        paid("cs_2", { orderNumber: 1002, status: "completed", orderType: "Delivery", name: "Bo" }),
        { id: "cs_3", payment_status: "pending", orderType: "Collection", name: "Abandoned" },
      ])
    )
  );
  expect(screen.getByText("#1001")).toBeTruthy();
  expect(screen.getByText("Start preparing")).toBeTruthy();
  expect(screen.queryByText("#1002")).toBeNull(); // finished: not in the live queue
  expect(screen.queryByText("Abandoned")).toBeNull(); // unpaid: never reaches the kitchen
  expect(screen.getByText("Live Orders (1)")).toBeTruthy();

  await fireEvent.press(screen.getByText("Completed"));
  expect(screen.getByText("#1002")).toBeTruthy();
  expect(screen.getByText("Delivered")).toBeTruthy();
});

it("one tap moves the order on and stamps the time", async () => {
  await renderDashboard();
  await act(() => mockEmit(feed([paid("cs_1", { orderNumber: 1001, status: "preparing", orderType: "Delivery" })])));

  await fireEvent.press(screen.getByText("Send out for delivery"));
  await waitFor(() =>
    expect(mockUpdateDoc).toHaveBeenCalledWith("orders/cs_1", {
      status: "ready",
      "statusTimes.ready": "SERVER_TIME",
    })
  );
});

it("lets the kitchen undo a mis-tap from the order details", async () => {
  await renderDashboard();
  await act(() => mockEmit(feed([paid("cs_1", { orderNumber: 1001, status: "ready", orderType: "Collection" })])));

  await fireEvent.press(screen.getByLabelText("Order #1001"));
  await fireEvent.press(screen.getByText("Undo — back to Preparing"));
  await waitFor(() =>
    expect(mockUpdateDoc).toHaveBeenCalledWith("orders/cs_1", {
      status: "preparing",
      "statusTimes.preparing": "SERVER_TIME",
    })
  );
});

it("tells the kitchen when an update fails", async () => {
  mockUpdateDoc.mockImplementationOnce(() => Promise.reject(new Error("offline")));
  jest.spyOn(console, "error").mockImplementation(() => {});
  await renderDashboard();
  await act(() => mockEmit(feed([paid("cs_1", { orderNumber: 1001, status: "placed", orderType: "Collection" })])));

  await fireEvent.press(screen.getByText("Start preparing"));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Couldn't update order", expect.stringContaining("#1001")));
});
