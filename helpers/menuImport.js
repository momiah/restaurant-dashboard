// Menu import, tablet side: get a menu file (camera photo or a document), upload it
// to menu-imports/{restaurantId}/ and ask the importMenu Cloud Function to read it.
// The function returns a draft { categories, warnings } — nothing is saved yet.
import * as DocumentPicker from "expo-document-picker";
import { ref, uploadBytes } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { storage, functions } from "../config/firebase.config";
import { pickPhoto, preparePhoto, uriToBlob } from "./menuPhotos";

export const MENU_FILE_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
const MAX_FILE_BYTES = 20 * 1024 * 1024;
// Big enough for Claude to read small print, small enough for its 5 MB image limit.
const MENU_PHOTO_WIDTH = 2000;

// Android sometimes reports a generic or missing type; trust the extension then.
export function menuFileType(name, mimeType) {
  const ext = ((name || "").toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1];
  if (ext && MENU_FILE_TYPES[ext]) return MENU_FILE_TYPES[ext];
  if (Object.values(MENU_FILE_TYPES).includes(mimeType)) return mimeType;
  if (mimeType === "text/comma-separated-values") return "text/csv";
  return null;
}

// Returns { uri, name, contentType } or null if cancelled.
export async function pickMenuFile(source) {
  if (source === "camera") {
    const photo = await pickPhoto("camera", { crop: false });
    if (!photo) return null;
    const uri = await preparePhoto(photo, MENU_PHOTO_WIDTH, 0.85);
    return { uri, name: "menu-photo.jpg", contentType: "image/jpeg" };
  }
  const result = await DocumentPicker.getDocumentAsync({
    type: [...new Set(Object.values(MENU_FILE_TYPES)), "text/comma-separated-values"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.length) return null;
  const { uri, name, mimeType, size } = result.assets[0];
  const contentType = menuFileType(name, mimeType);
  if (!contentType) {
    throw new Error("That file type isn't supported. Use a photo, PDF, Word (.docx), Excel (.xlsx) or CSV file.");
  }
  if (size && size > MAX_FILE_BYTES) throw new Error("That file is over 20 MB. Try a smaller file.");
  if (contentType.startsWith("image/")) {
    // Phone photos can be 10 MB+; shrink them like a camera shot.
    return { uri: await preparePhoto({ uri }, MENU_PHOTO_WIDTH, 0.85), name, contentType: "image/jpeg" };
  }
  return { uri, name, contentType };
}

export function importFilePath(restaurantId, name, now = Date.now()) {
  const safe = (name || "menu").replace(/[^A-Za-z0-9._-]+/g, "-").slice(-80);
  return `menu-imports/${restaurantId}/${now}-${safe}`;
}

// The function's HttpsError messages are written for owners; anything else isn't.
export function importErrorMessage(err) {
  const friendly = ["functions/failed-precondition", "functions/permission-denied", "functions/not-found", "functions/invalid-argument", "functions/unauthenticated"];
  if (friendly.includes(err?.code) && err.message) return err.message;
  if (err?.code === "functions/deadline-exceeded") return "Reading the menu took too long. Try a clearer photo, or one page at a time.";
  if (err?.code === "storage/unauthorized") return "You don't have permission to upload menus for this restaurant.";
  if (err?.code?.startsWith?.("functions/") || err?.code?.startsWith?.("storage/")) {
    return "Something went wrong reading that menu. Check the connection and try again.";
  }
  return err?.message || "Something went wrong reading that menu.";
}

// Upload + read. Returns { categories, warnings }.
export async function importMenuFile(restaurantId, file) {
  const path = importFilePath(restaurantId, file.name);
  const blob = await uriToBlob(file.uri);
  try {
    await uploadBytes(ref(storage, path), blob, { contentType: file.contentType });
  } finally {
    blob.close?.();
  }
  const call = httpsCallable(functions, "importMenu", { timeout: 300000 });
  const { data } = await call({ restaurantId, path, fileName: file.name });
  return { categories: data?.categories || [], warnings: data?.warnings || [] };
}
