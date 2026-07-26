import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { CartItem, Sale } from "@/lib/schemas/sale";

export async function commitSale(
  saleId: string,
  cart: CartItem[],
  cashierId: string,
  cashierName: string,
): Promise<void> {
  const pendingRef = doc(db, "pendingSales", saleId);
  const saleRef = doc(db, "sales", saleId);

  await runTransaction(db, async (tx) => {
    const pendingSnap = await tx.get(pendingRef);
    if (!pendingSnap.exists() || pendingSnap.data().status !== "pending") {
      throw new Error("Sale already processed or no longer pending.");
    }

    for (const item of cart) {
      const productRef = doc(db, "products", item.productId);
      const productSnap = await tx.get(productRef);
      if (!productSnap.exists()) {
        throw new Error(`Product "${item.name}" no longer exists.`);
      }
      const currentQty = productSnap.data().quantity as number;
      if (currentQty < item.qty) {
        throw new Error(
          `Insufficient stock for "${item.name}". Available: ${currentQty}, requested: ${item.qty}.`,
        );
      }
    }

    for (const item of cart) {
      const productRef = doc(db, "products", item.productId);
      const productSnap = await tx.get(productRef);
      const data = productSnap.data()!;
      const currentQty = data.quantity as number;
      const newQty = currentQty - item.qty;

      tx.update(productRef, {
        quantity: newQty,
        updatedAt: serverTimestamp(),
      });

      const logRef = doc(collection(db, "stockLogs"));
      tx.set(logRef, {
        productId: item.productId,
        type: "sale",
        delta: -item.qty,
        resultingQuantity: newQty,
        note: null,
        actorId: cashierId,
        createdAt: serverTimestamp(),
      });
    }

    const total = cart.reduce((sum, item) => sum + item.lineTotal, 0);

    tx.set(saleRef, {
      items: cart,
      total,
      cashierId,
      cashierName,
      createdAt: serverTimestamp(),
    });

    tx.update(pendingRef, { status: "committed" });
  });
}

export async function getSales() {
  const q = query(collection(db, "sales"), orderBy("createdAt", "desc"), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sale & { id: string }));
}

export function onSalesChange(callback: (sales: (Sale & { id: string })[]) => void) {
  const q = query(collection(db, "sales"), orderBy("createdAt", "desc"), limit(200));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sale & { id: string })));
  });
}

export async function getSale(id: string) {
  const snap = await getDoc(doc(db, "sales", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Sale & { id: string };
}
