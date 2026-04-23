import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email not valid'],
    },
    password: {
      type: String,
      required: [true, 'Password required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // non restituita di default nelle query
    },
  },
  { timestamps: true }
)

// Hash password prima del salvataggio
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

// Metodo istanza: confronta password in chiaro con hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Metodo istanza: versione sicura dell'utente (senza password)
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    createdAt: this.createdAt,
  }
}

export default mongoose.model('User', userSchema)