import { Router } from 'express'
import { protect } from '../middleware/auth.middleware.js'
import {
  createTemplate,
  deleteTemplate,
  getMyTemplates,
  getPublicTemplates,
  getTemplateById,
  updateTemplate,
} from '../controllers/template.controller.js'

const router = Router()

router.get('/public', getPublicTemplates)
router.get('/mine', protect, getMyTemplates)
router.post('/', protect, createTemplate)
router.put('/:id', protect, updateTemplate)
router.delete('/:id', protect, deleteTemplate)
router.get('/:id', getTemplateById)

export default router
