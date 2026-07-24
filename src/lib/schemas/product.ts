import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  barcode: z.string().nullable().optional(),
  categoryName: z.string().min(1, "Category is required"),
  unitPrice: z.number().nonnegative("Price must be non-negative"),
  quantity: z.number().int().nonnegative("Quantity must be non-negative"),
  bufferQuantity: z.number().int().nonnegative().default(5),
  imageUrl: z.string().nullable().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export const AddStockSchema = z.object({
  productId: z.string().min(1),
  delta: z.number().int().positive("Must add at least 1"),
  note: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;
