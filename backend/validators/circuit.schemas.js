import { z } from 'zod'

const gateSchema = z.union([
  z.literal('H'),
  z.literal('X'),
  z.literal('M'),
  z.literal('S'),
  z.literal('CNOT'),
  z.null(),
])

const cnotCellSchema = z.object({
  gate: z.literal('CNOT'),
  role: z.union([z.literal('ctrl'), z.literal('tgt')]),
  partner: z.number().int().nonnegative(),
})

const cellSchema = z.union([gateSchema, cnotCellSchema])

const circuitMatrixSchema = z
  .array(z.array(cellSchema, { error: 'Each circuit row must be an array' }), { error: 'Circuit must be an array of rows' })
  .min(1, 'Circuit must contain at least one qubit row')

const qubitStateSchema = z.object({
  value: z.union([z.literal(0), z.literal(1)]),
  superposition: z.boolean(),
})

export const runCircuitSchema = z.object({
  circuit: circuitMatrixSchema,
  shots: z.coerce.number().int().min(1).max(10000).optional(),
})

export const applyGateSchema = z
  .object({
    qubitStates: z.array(qubitStateSchema).min(1, 'qubitStates must contain at least one item'),
    gate: z.union([z.literal('H'), z.literal('X'), z.literal('M'), z.literal('S'), z.literal('CNOT')]),
    qubitIndex: z.coerce.number().int().optional(),
    controlIndex: z.coerce.number().int().optional(),
    targetIndex: z.coerce.number().int().optional(),
  })

export const saveCircuitSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  circuitMatrix: circuitMatrixSchema,
})

export const updateCircuitSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    circuitMatrix: circuitMatrixSchema.optional(),
    lastResult: z.any().optional(),
  })
  .refine((v) => v.name !== undefined || v.circuitMatrix !== undefined || v.lastResult !== undefined, {
    message: 'At least one field among name, circuitMatrix or lastResult is required',
  })

export const objectIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id format'),
})

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})
