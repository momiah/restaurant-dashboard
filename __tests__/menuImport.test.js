import * as DocumentPicker from "expo-document-picker";
import { importErrorMessage, importFilePath, importMenuFile, menuFileType, pickMenuFile } from "../helpers/menuImport";

jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
const mockPreparePhoto = jest.fn(() => Promise.resolve("file:///cache/small.jpg"));
jest.mock("../helpers/menuPhotos", () => ({
  pickPhoto: jest.fn(() => Promise.resolve({ uri: "file:///cam.jpg", width: 4000 })),
  preparePhoto: (...args) => mockPreparePhoto(...args),
  uriToBlob: () => Promise.resolve({ close: jest.fn() }),
}));
const mockUploadBytes = jest.fn(() => Promise.resolve());
jest.mock("firebase/storage", () => ({ ref: (_s, path) => ({ path }), uploadBytes: (...a) => mockUploadBytes(...a) }));
const mockCallable = jest.fn();
const mockHttpsCallable = jest.fn(() => mockCallable);
jest.mock("firebase/functions", () => ({ httpsCallable: (...a) => mockHttpsCallable(...a) }));
jest.mock("../config/firebase.config", () => ({ storage: {}, functions: {} }));

beforeEach(() => jest.clearAllMocks());

it("works out the file type, trusting the extension over Android's guess", () => {
  expect(menuFileType("Menu.PDF", "application/octet-stream")).toBe("application/pdf");
  expect(menuFileType("menu.docx")).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  expect(menuFileType("prices", "text/comma-separated-values")).toBe("text/csv");
  expect(menuFileType("menu.doc", "application/msword")).toBeNull();
});

it("stores uploads under the restaurant's private import folder with a safe name", () => {
  expect(importFilePath("taco-monster", "Our Menu (2026).pdf", 5)).toBe("menu-imports/taco-monster/5-Our-Menu-2026-.pdf");
});

it("camera photos are shrunk for reading, not cropped", async () => {
  const file = await pickMenuFile("camera");
  expect(require("../helpers/menuPhotos").pickPhoto).toHaveBeenCalledWith("camera", { crop: false });
  expect(mockPreparePhoto).toHaveBeenCalledWith({ uri: "file:///cam.jpg", width: 4000 }, 2000, 0.85);
  expect(file).toEqual({ uri: "file:///cache/small.jpg", name: "menu-photo.jpg", contentType: "image/jpeg" });
});

it("rejects unsupported and oversized documents with a clear message", async () => {
  DocumentPicker.getDocumentAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: "f", name: "menu.doc", mimeType: "application/msword" }] });
  await expect(pickMenuFile("file")).rejects.toThrow(/isn't supported/);
  DocumentPicker.getDocumentAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: "f", name: "menu.pdf", size: 30 * 1024 * 1024 }] });
  await expect(pickMenuFile("file")).rejects.toThrow(/over 20 MB/);
  DocumentPicker.getDocumentAsync.mockResolvedValueOnce({ canceled: true, assets: null });
  expect(await pickMenuFile("file")).toBeNull();
});

it("uploads the file, then asks importMenu to read it", async () => {
  mockCallable.mockResolvedValue({ data: { categories: [{ category: "Tacos", items: [] }], warnings: ["Check prices"] } });
  const result = await importMenuFile("taco-monster", { uri: "file:///m.pdf", name: "m.pdf", contentType: "application/pdf" });

  const [fileRef, , meta] = mockUploadBytes.mock.calls[0];
  expect(fileRef.path).toMatch(/^menu-imports\/taco-monster\/\d+-m\.pdf$/);
  expect(meta).toEqual({ contentType: "application/pdf" });
  expect(mockHttpsCallable).toHaveBeenCalledWith({}, "importMenu", { timeout: 300000 });
  expect(mockCallable).toHaveBeenCalledWith({ restaurantId: "taco-monster", path: fileRef.path, fileName: "m.pdf" });
  expect(result).toEqual({ categories: [{ category: "Tacos", items: [] }], warnings: ["Check prices"] });
});

it("shows the function's own explanations, and a generic one for anything else", () => {
  expect(importErrorMessage({ code: "functions/failed-precondition", message: "That file is empty." })).toBe("That file is empty.");
  expect(importErrorMessage({ code: "functions/internal", message: "INTERNAL" })).toMatch(/Something went wrong/);
  expect(importErrorMessage({ code: "functions/deadline-exceeded", message: "x" })).toMatch(/took too long/);
});
