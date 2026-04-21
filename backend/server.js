import 'dotenv/config'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import { connectDB } from './config/db.js'
import authRoutes from './routes/auth.routes.js'
import circuitRoutes from './routes/circuit.routes.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/circuits', circuitRoutes)

const startServer = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => console.log(`Server on :${PORT}`))
  } catch (error) {
    console.error('[server:start]', error.message)
    process.exit(1)
  }
}

startServer()
