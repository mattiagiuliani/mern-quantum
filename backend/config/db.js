import mongoose from 'mongoose'

export async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI

  if (!uri) {
    throw new Error('Set MONGODB_URI or MONGO_URI in the environment variables.')
  }

  await mongoose.connect(uri)
  console.log('MongoDB connected')
}
