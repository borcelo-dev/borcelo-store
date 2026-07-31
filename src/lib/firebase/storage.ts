import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

export async function uploadProfileImage(uid: string, file: File): Promise<string> {
  const storageRef = ref(storage, `profile-images/${uid}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}