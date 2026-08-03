import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { commitSale } from "@/lib/data-access/sales";
import { offlineQueue } from "@/lib/offline-queue";
import type { CartItem } from "@/lib/schemas/sale";

// Internal: write a single pending sale document to Firestore.
async function writeToFirestore(
  saleId: string,
  cart: CartItem[],
  cashierId: string,
  cashierName: string,
): Promise<void> {
  await setDoc(doc(db, "pendingSales", saleId), {
    cart,
    cashierId,
    cashierName,
    status: "pending",
    conflictReason: null,
    createdAt: serverTimestamp(),
  });
}

/**
 * Stage a sale for processing.
 * - Online  → writes directly to Firestore `pendingSales`.
 * - Offline → writes to the local IndexedDB queue; will flush on reconnect.
 */
export async function stageSale(
  cart: CartItem[],
  cashierId: string,
  cashierName: string,
): Promise<string> {
  const saleId = crypto.randomUUID();

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    // Offline path — persist locally.
    await offlineQueue.enqueue({ id: saleId, cart, cashierId, cashierName, queuedAt: Date.now() });
  } else {
    // Online path — write to Firestore immediately.
    await writeToFirestore(saleId, cart, cashierId, cashierName);
  }

  return saleId;
}

/**
 * Flush all locally queued (offline) sales to Firestore.
 * Called by SyncContext when connectivity is restored or on the 30s poll.
 * Returns the number of entries successfully flushed.
 */
export async function flushLocalQueue(): Promise<number> {
  const queued = await offlineQueue.getAll();
  if (queued.length === 0) return 0;

  let flushed = 0;
  for (const sale of queued) {
    try {
      await writeToFirestore(sale.id, sale.cart, sale.cashierId, sale.cashierName);
      await offlineQueue.remove(sale.id);
      flushed++;
    } catch {
      // Leave in queue — will retry on next flush cycle.
    }
  }
  return flushed;
}

export async function processPendingSales(
  onStatus?: (state: { syncing: boolean; pendingCount: number; conflictCount: number }) => void,
): Promise<void> {
  const q = query(
    collection(db, "pendingSales"),
    where("status", "==", "pending"),
    orderBy("createdAt"),
  );

  const snap = await getDocs(q);
  if (snap.empty) {
    onStatus?.({ syncing: false, pendingCount: 0, conflictCount: await getConflictCount() });
    return;
  }

  let remaining = snap.docs.length;
  onStatus?.({ syncing: true, pendingCount: remaining, conflictCount: await getConflictCount() });

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    try {
      await commitSale(docSnap.id, data.cart, data.cashierId, data.cashierName);
      remaining--;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Stock validation failed";
      try {
        await setDoc(
          doc(db, "pendingSales", docSnap.id),
          { status: "conflict", conflictReason: message },
          { merge: true },
        );
      } catch {
        // best-effort conflict recording
      }
      remaining--;
    }
    onStatus?.({ syncing: remaining > 0, pendingCount: remaining, conflictCount: await getConflictCount() });
  }
}

export async function getConflictCount(): Promise<number> {
  const q = query(
    collection(db, "pendingSales"),
    where("status", "==", "conflict"),
  );
  const snap = await getDocs(q);
  return snap.size;
}

export async function dismissConflict(saleId: string): Promise<void> {
  await deleteDoc(doc(db, "pendingSales", saleId));
}

export function onPendingSalesChange(
  callback: (pendingCount: number, conflictCount: number) => void,
) {
  const q = query(collection(db, "pendingSales"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    let pending = 0;
    let conflicts = 0;
    snap.docs.forEach((d) => {
      const s = d.data().status as string;
      if (s === "pending") pending++;
      if (s === "conflict") conflicts++;
    });
    callback(pending, conflicts);
  });
}
