import { z } from "zod";
import { CartItemSchema } from "./sale";

export const PendingSaleSchema = z.object({
  cart: z.array(CartItemSchema).min(1),
  cashierId: z.string().min(1),
  cashierName: z.string().min(1),
  status: z.enum(["pending", "committed", "conflict"]),
  conflictReason: z.string().nullable(),
  createdAt: z.any().optional(),
});

export type PendingSale = z.infer<typeof PendingSaleSchema>;
