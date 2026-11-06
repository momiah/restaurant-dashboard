// Boot smoke test: renders the real App with the real Firebase JS SDK (no mocks) in a
// runtime without browser globals — the conditions that crash an Expo app on a phone if
// a dependency reaches for `document`/`window` at startup, or Firebase Auth isn't wired
// for React Native. Signed out, the app must land on the owner sign-in screen.
import React from "react";
import { render, screen } from "@testing-library/react-native";
import App from "../App";

it("runs without browser globals, like Hermes on a device", () => {
  expect(typeof document).toBe("undefined");
});

it("boots to the owner sign-in screen without crashing", async () => {
  await render(<App />);
  expect(await screen.findByText("Owner sign in", {}, { timeout: 10000 })).toBeTruthy();
});
