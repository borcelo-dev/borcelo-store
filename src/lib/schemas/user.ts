import { z } from "zod";

export const UserSchema = z.object({
  displayName: z.string().min(1),
  role: z.enum(["super_admin", "owner", "cashier"]),
  photoURL: z.string().url().optional(),
});

export type AppUser = z.infer<typeof UserSchema>;
