import { Router } from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.js'
import {
  createTemplate,
  deleteTemplate,
  getMyTemplates,
  getPublicTemplates,
  getTemplateById,
  updateTemplate,
} from '../controllers/template.controller.js'
import {
  createTemplateSchema,
  templateIdParamSchema,
  templateListQuerySchema,
  updateTemplateSchema,
} from '../validators/template.schemas.js'

const router = Router()

router.get('/public', validate(templateListQuerySchema, 'query'), getPublicTemplates)
router.get('/mine', protect, validate(templateListQuerySchema, 'query'), getMyTemplates)
router.post('/', protect, validate(createTemplateSchema), createTemplate)
router.put('/:id', protect, validate(templateIdParamSchema, 'params'), validate(updateTemplateSchema), updateTemplate)
router.delete('/:id', protect, validate(templateIdParamSchema, 'params'), deleteTemplate)
router.get('/:id', validate(templateIdParamSchema, 'params'), getTemplateById)

export default router
