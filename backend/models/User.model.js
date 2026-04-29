import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

export const MAX_LOGIN_ATTEMPTS = 5
export const LOCK_TIME_MS = 15 * 60 * 1000 // 15 minutes

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
      minlength: [8, 'Password must be at least 8 characters'],
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ],
      select: false,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
  },
  { timestamps: true }
)

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

/**
 * Compare a plain-text candidate against the stored bcrypt hash.
 * Requires the document to have been fetched with `.select('+password')`.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

/**
 * Return a safe, serialisable representation of the user (no password/tokens).
 * @returns {{ id: string, username: string, email: string, createdAt: Date }}
 */
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    createdAt: this.createdAt,
  }
}

/**
 * True if the account is currently within a lockout window.
 * @returns {boolean}
 */
userSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil > Date.now())
}

/**
 * Increment the failed login counter and set a lockout if the threshold is reached.
 * If a previous lock has expired, resets the counter to 1 instead.
 * @returns {Promise<void>}
 */
userSchema.methods.incrementLoginAttempts = async function () {
  // Lock expired — reset and start fresh
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } })
  }
  const updates = { $inc: { loginAttempts: 1 } }
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_TIME_MS) }
  }
  return this.updateOne(updates)
}

export default mongoose.model('User', userSchema)