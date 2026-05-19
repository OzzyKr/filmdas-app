import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.string().email().max(254)),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/\d/, 'Password must contain a digit'),
  name: z.string().trim().min(1, 'Name is required').max(80),
});

export type SignupDto = z.infer<typeof signupSchema>;
