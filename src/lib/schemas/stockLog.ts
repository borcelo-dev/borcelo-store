import { z } from "zod";

export const StockLogSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["restock", "sale", "adjustment"]),
  delta: z.number().int(),
  resultingQuantity: z.number().int().nonnegative(),
  note: z.string().nullable().optional(),
  actorId: z.string().min(1),
  createdAt: z.any().optional(),
});

export type StockLog = z.infer<typeof StockLogSchema>;
