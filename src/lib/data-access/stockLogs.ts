import {
  collection,
  query,
  getDocs,
  orderBy,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { StockLog } from "@/lib/schemas/stockLog";

export async function getStockLogs(productId: string) {
  const q = query(
    collection(db, "stockLogs"),
    where("productId", "==", productId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockLog & { id: string }));
}

export function onStockLogsChange(
  productId: string,
  callback: (logs: (StockLog & { id: string })[]) => void
) {
  const q = query(
    collection(db, "stockLogs"),
    where("productId", "==", productId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockLog & { id: string })));
  });
}

export async function getSaleStockLogs() {
  const q = query(
    collection(db, "stockLogs"),
    where("type", "==", "sale"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockLog & { id: string }));
}
