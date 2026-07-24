import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
  where,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import { ProductSchema, type Product } from "@/lib/schemas/product";

export async function getProducts() {
  const q = query(collection(db, "products"), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product & { id: string }));
}

export function onProductsChange(callback: (products: (Product & { id: string })[]) => void) {
  const q = query(collection(db, "products"), orderBy("name"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product & { id: string })));
  });
}

export async function getProduct(id: string) {
  const snap = await getDoc(doc(db, "products", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Product & { id: string };
}

export async function createProduct(data: Omit<Product, "createdAt" | "updatedAt">) {
  const parsed = ProductSchema.parse(data);
  const docRef = doc(collection(db, "products"));
  const payload = {
    ...parsed,
    imageUrl: parsed.imageUrl ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(docRef, payload);
  return { id: docRef.id, ...payload };
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const ref = doc(db, "products", id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function addStock(
  productId: string,
  delta: number,
  actorId: string,
  note?: string
) {
  const ref = doc(db, "products", productId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Product not found");
    const current = snap.data()!.quantity as number;
    tx.update(ref, {
      quantity: current + delta,
      updatedAt: serverTimestamp(),
    });
    const logRef = doc(collection(db, "stockLogs"));
    tx.set(logRef, {
      productId,
      type: "restock",
      delta,
      resultingQuantity: current + delta,
      note: note ?? null,
      actorId,
      createdAt: serverTimestamp(),
    });
  });
}

export async function uploadProductImage(file: File): Promise<string> {
  const fileRef = ref(storage, `products/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export async function getProductsByBarcode(barcode: string) {
  const q = query(collection(db, "products"), where("barcode", "==", barcode));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Product & { id: string };
}

export { db };
