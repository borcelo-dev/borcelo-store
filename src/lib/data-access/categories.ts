import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { CategorySchema, type Category } from "@/lib/schemas/category";

export async function getCategories() {
  const q = query(collection(db, "categories"), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
}

export function onCategoriesChange(callback: (categories: Category[]) => void) {
  const q = query(collection(db, "categories"), orderBy("name"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category)));
  });
}

export async function createCategory(name: string) {
  const parsed = CategorySchema.parse({ name });
  return addDoc(collection(db, "categories"), parsed);
}
