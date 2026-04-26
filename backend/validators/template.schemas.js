import { z } from 'zod'

const gateSchema = z.union([
  z.literal('H'),
  z.literal('X'),
  z.literal('M'),
  z.literal('CNOT'),
  z.null(),
])

const cnotCellSchema = z.object({
  gate: z.literal('CNOT'),
  role: z.union([z.literal('ctrl'), z.literal('tgt')]),
  partner: z.number().int().nonnegative(),
})

const cellSchema = z.union([gateSchema, cnotCellSchema])

const templateCircuitSchema = z
  .array(z.array(cellSchema, { error: 'Each circuit row must be an array' }), { error: 'Circuit must be an array of rows' })
  .min(1, 'Circuit must contain at least one qubit row')

export const createTemplateSchema = z.object({
  name: z.string({ error: 'Template name is required' }).trim().min(1, 'Template name is required').max(120),
  description: z.string().trim().max(500).optional().default(''),
  circuit: templateCircuitSchema,
  tags: z.array(z.string().trim().min(1)).max(20).optional().default([]),
  isPublic: z.boolean().optional().default(false),
})

export const updateTemplateSchema = createTemplateSchema

export const templateIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid template id'),
})

export const templateListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  tag: z.string().trim().min(1).max(30).optional(),
})
