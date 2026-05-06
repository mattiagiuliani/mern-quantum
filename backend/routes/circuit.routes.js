import { Router } from 'express'
import { runCircuit, applyGate, saveCircuit, getMineCircuits, getCircuitById, updateCircuit, deleteCircuit } from '../controllers/circuit.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.js'
import {
	applyGateSchema,
	objectIdParamSchema,
	paginationQuerySchema,
	runCircuitSchema,
	saveCircuitSchema,
	updateCircuitSchema,
} from '../validators/circuit.schemas.js'

const router = Router()

router.post('/run',        validate(runCircuitSchema), runCircuit)
router.post('/applyGate',  validate(applyGateSchema), applyGate)

// authenticated CRUD
router.post('/',           protect, validate(saveCircuitSchema), saveCircuit)
router.get('/mine',        protect, validate(paginationQuerySchema, 'query'), getMineCircuits)
router.get('/:id',         protect, validate(objectIdParamSchema, 'params'), getCircuitById)
router.put('/:id',         protect, validate(objectIdParamSchema, 'params'), validate(updateCircuitSchema), updateCircuit)
router.delete('/:id',      protect, validate(objectIdParamSchema, 'params'), deleteCircuit)

export default router
