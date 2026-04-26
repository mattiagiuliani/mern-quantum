import { z } from 'zod'

const emailSchema = z
  .string({ error: 'Email is required' })
  .trim()
  .email('Email must be valid')

const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(6, 'Password must be at least 6 characters long')

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
