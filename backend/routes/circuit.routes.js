import { Router } from 'express'
import { runCircuit, applyGate, saveCircuit, getMineCircuits, getCircuitById, updateCircuit, deleteCircuit } from '../controllers/circuit.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/run',        runCircuit)
router.post('/applyGate',  applyGate)

// authenticated CRUD
router.post('/',           protect, saveCircuit)
router.get('/mine',        protect, getMineCircuits)
router.get('/:id',         protect, getCircuitById)
router.put('/:id',         protect, updateCircuit)
router.delete('/:id',      protect, deleteCircuit)

export default router
