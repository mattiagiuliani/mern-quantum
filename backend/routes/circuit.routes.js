import { Router } from 'express'
import { runCircuit, applyGate } from '../controllers/circuit.controller.js'

const router = Router()

router.post('/run',       runCircuit)
router.post('/applyGate', applyGate)

export default router
