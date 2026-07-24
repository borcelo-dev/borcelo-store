import { z } from "zod";

export const CartItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  qty: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
});

export const SaleSchema = z.object({
  items: z.array(CartItemSchema).min(1, "Cart must have at least one item"),
  total: z.number().nonnegative(),
  cashierId: z.string().min(1),
  cashierName: z.string().min(1),
  createdAt: z.any().optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type Sale = z.infer<typeof SaleSchema>;
