import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserSchema, type AppUser } from "@/lib/schemas/user";

export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as AppUser & { uid: string };
}

export async function createUser(uid: string, data: AppUser) {
  const parsed = UserSchema.parse(data);
  return setDoc(doc(db, "users", uid), parsed);
}

export async function getUsers() {
  const q = query(collection(db, "users"), orderBy("displayName"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser & { uid: string }));
}
