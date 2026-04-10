
import { Router } from 'express'
import { register, login, logout, getMe } from './controllers/auth.controller.js'
import { protect } from './middleware/auth.middleware.js'
 
const router = Router()
 
router.post('/register', register)
router.post('/login',    login)
router.post('/logout',   protect, logout) // protect opzionale: pulisce sempre il cookie
router.get('/me',        protect, getMe)
 
export default router
 