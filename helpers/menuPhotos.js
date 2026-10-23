// Menu item photos: take or pick a picture on the tablet, shrink it, upload it to
// restaurants/{id}/menu/ in Storage and hand back the public URL for item.imageUrl.
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase.config";

// Big enough for the website's item pop-up, small enough to load fast on mobile data
// (and well under the 5 MB the storage rules allow).
export const MAX_PHOTO_WIDTH = 1200;

const slugify = (s) =>
  (s || "item").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";

// Returns { uri, width } for the chosen photo, or null if the owner cancelled.
// Throws a friendly error when camera permission is refused.
export async function pickPhoto(source) {
  const options = { mediaTypes: ["images"], allowsEditing: true, aspect: [4, 3], quality: 1 };
  let result;
  if (source === "camera") {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) throw new Error("Camera access is off. Turn it on in the tablet's Settings to take photos.");
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }
  if (result.canceled || !result.assets?.length) return null;
  const { uri, width } = result.assets[0];
  return { uri, width };
}

// Shrinks wide photos and re-encodes everything as JPEG.
export async function preparePhoto({ uri, width }) {
  const context = ImageManipulator.manipulate(uri);
  if (!width || width > MAX_PHOTO_WIDTH) context.resize({ width: MAX_PHOTO_WIDTH });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return saved.uri;
}

// fetch(uri).blob() is unreliable for local files on Android; XHR is the safe route.
export function uriToBlob(uri) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error("Couldn't read the photo from the tablet."));
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
}

export function menuPhotoPath(restaurantId, itemName, now = Date.now()) {
  return `restaurants/${restaurantId}/menu/${slugify(itemName)}-${now}.jpg`;
}

// Full flow for one photo. Returns the download URL, or null if cancelled.
export async function addMenuPhoto({ restaurantId, itemName, source }) {
  const picked = await pickPhoto(source);
  if (!picked) return null;
  const jpegUri = await preparePhoto(picked);
  const blob = await uriToBlob(jpegUri);
  try {
    const photoRef = ref(storage, menuPhotoPath(restaurantId, itemName));
    await uploadBytes(photoRef, blob, { contentType: "image/jpeg", cacheControl: "public, max-age=31536000" });
    return await getDownloadURL(photoRef);
  } finally {
    blob.close?.();
  }
}
