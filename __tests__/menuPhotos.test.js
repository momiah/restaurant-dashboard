import * as ImagePicker from "expo-image-picker";
import { addMenuPhoto, menuPhotoPath, MAX_PHOTO_WIDTH } from "../helpers/menuPhotos";

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
const mockResize = jest.fn();
jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  ImageManipulator: {
    manipulate: () => {
      const ctx = {
        resize: (size) => {
          mockResize(size);
          return ctx;
        },
        renderAsync: () => Promise.resolve({ saveAsync: () => Promise.resolve({ uri: "file:///cache/small.jpg" }) }),
      };
      return ctx;
    },
  },
}));
const mockUploadBytes = jest.fn(() => Promise.resolve());
jest.mock("firebase/storage", () => ({
  ref: (_storage, path) => ({ path }),
  uploadBytes: (...args) => mockUploadBytes(...args),
  getDownloadURL: (r) => Promise.resolve(`https://cdn.example/${r.path}`),
}));
jest.mock("../config/firebase.config", () => ({ storage: {} }));

// Android-safe blob read goes through XHR; fake it.
const blob = { close: jest.fn() };
global.XMLHttpRequest = function () {
  this.open = jest.fn();
  this.send = () => {
    this.response = blob;
    this.onload();
  };
};

beforeEach(() => jest.clearAllMocks());

it("names photos by item, under the restaurant's menu folder", () => {
  expect(menuPhotoPath("taco-monster", "Soft Taco (Large)", 123)).toBe("restaurants/taco-monster/menu/soft-taco-large-123.jpg");
  expect(menuPhotoPath("taco-monster", "", 1)).toBe("restaurants/taco-monster/menu/item-1.jpg");
});

it("shrinks a big library photo, uploads it as JPEG and returns its URL", async () => {
  ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///big.jpg", width: 4000 }] });
  const url = await addMenuPhoto({ restaurantId: "taco-monster", itemName: "Soft Taco", source: "library" });

  expect(mockResize).toHaveBeenCalledWith({ width: MAX_PHOTO_WIDTH });
  const [photoRef, body, meta] = mockUploadBytes.mock.calls[0];
  expect(photoRef.path).toMatch(/^restaurants\/taco-monster\/menu\/soft-taco-\d+\.jpg$/);
  expect(body).toBe(blob);
  expect(meta.contentType).toBe("image/jpeg");
  expect(url).toBe(`https://cdn.example/${photoRef.path}`);
  expect(blob.close).toHaveBeenCalled();
});

it("leaves small photos at their size", async () => {
  ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///s.jpg", width: 800 }] });
  await addMenuPhoto({ restaurantId: "r", itemName: "x", source: "library" });
  expect(mockResize).not.toHaveBeenCalled();
});

it("returns null and uploads nothing when the owner cancels", async () => {
  ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: true, assets: null });
  expect(await addMenuPhoto({ restaurantId: "r", itemName: "x", source: "camera" })).toBeNull();
  expect(mockUploadBytes).not.toHaveBeenCalled();
});

it("explains when camera access is refused", async () => {
  ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ granted: false });
  await expect(addMenuPhoto({ restaurantId: "r", itemName: "x", source: "camera" })).rejects.toThrow(/Camera access is off/);
  expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
});
