import { z } from 'zod'

const emailSchema = z
  .string({ error: 'Email is required' })
  .trim()
  .email('Email must be valid')

const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  )

export const registerSchema = z.object({
  username: z
    .string({ error: 'Username is required' })
    .trim()
    .min(1, 'Username is required'),
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required'),
})
