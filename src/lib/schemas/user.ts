import { z } from "zod";

export const UserSchema = z.object({
  displayName: z.string().min(1),
  role: z.enum(["owner", "cashier"]),
});

export type AppUser = z.infer<typeof UserSchema>;
