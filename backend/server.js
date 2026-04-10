import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { connectDB } from './config/db.js'
import authRoutes from './routes/auth.routes.js'
import circuitRoutes from './routes/circuit.routes.js'

await connectDB()

const app = express()
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/circuits', circuitRoutes)

app.listen(3001, () => console.log('Server on :3001'))