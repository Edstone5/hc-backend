import * as z from 'zod';

export const userInsertSchema = z.object({
  userCode: z.string().min(11).max(11),
  firstName: z.string().min(10),
  lastName: z.string().min(10),
  dni: z.string().min(8),
  email: z.string().email(),
  role: z.string().min(1),
  password: z.string().min(6),
});
