const mongoose = require('mongoose')
const crypto = require('crypto');

function generateReferralCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }

  return result;
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      default: Date.now,
    },
    intake : String,
    nationality: String,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ""],
    },
    hasAcceptedTerms: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active',
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'counsellor', 'user'],
      default: 'user',
    },
    assignto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    firstLanguage: {
      type: String,
    },
    maritalStatus: {
      type: String,
      default: 'single',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    profileImage: {
      type: String,
      default: '',
    },
    referalCode: {
      type: String,
      unique: true,
      default: () => generateReferralCode(6)
    },
    referalBy: {
      type: String,
      default: '',
    },
    passportNumber: String,
    passportDetail :{
      issueDate : Date,
      expiryDate : Date,
      issueCountry : String
    },
    wallet: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true,
  }
)

userSchema.index({ email: 1 })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
