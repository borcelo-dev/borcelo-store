import { get, set, del, keys } from "idb-keyval";
import type { CartItem } from "@/lib/schemas/sale";

export type LocalSale = {
  id: string;
  cart: CartItem[];
  cashierId: string;
  cashierName: string;
  queuedAt: number;
};

const PREFIX = "sale:";

function saleKey(id: string) {
  return `${PREFIX}${id}`;
}

export const offlineQueue = {
  async enqueue(sale: LocalSale): Promise<void> {
    await set(saleKey(sale.id), sale);
  },

  async getAll(): Promise<LocalSale[]> {
    const all = await keys();
    const saleKeys = all.filter((k) => typeof k === "string" && (k as string).startsWith(PREFIX));
    const entries: LocalSale[] = [];
    for (const k of saleKeys) {
      const data = await get<LocalSale>(k);
      if (data) entries.push(data);
    }
    entries.sort((a, b) => a.queuedAt - b.queuedAt);
    return entries;
  },

  async remove(id: string): Promise<void> {
    await del(saleKey(id));
  },

  async count(): Promise<number> {
    const all = await keys();
    return all.filter((k) => typeof k === "string" && (k as string).startsWith(PREFIX)).length;
  },

  async clear(): Promise<void> {
    const all = await keys();
    for (const k of all) {
      if (typeof k === "string" && (k as string).startsWith(PREFIX)) {
        await del(k);
      }
    }
  },
};
