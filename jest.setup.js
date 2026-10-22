// Official in-memory AsyncStorage mock (used by Firebase Auth's RN persistence).
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
// expo-audio is a native module; tests only need the hook's shape.
jest.mock("expo-audio", () => ({
  useAudioPlayer: () => ({ loop: false, play: jest.fn(), pause: jest.fn(), seekTo: jest.fn() }),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));
