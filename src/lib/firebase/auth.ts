import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./config";

export async function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getUserDoc(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as { displayName: string; role: "super_admin" | "owner" | "cashier" };
}

export async function createUserDoc(
  uid: string,
  data: { displayName: string; role: "super_admin" | "owner" | "cashier"; photoURL?: string }
) {
  return setDoc(doc(db, "users", uid), data);
}

export async function updateUserDoc(
  uid: string,
  data: Partial<{ displayName: string; role: "super_admin" | "owner" | "cashier"; photoURL: string }>
) {
  return setDoc(doc(db, "users", uid), data, { merge: true });
}

export { auth };
