const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const User = require('../models/User')
const OTP = require('../models/OTP')
const { sendOTPEmail, sendVerificationEmail } = require('../utils/emailService')

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  })
}

// Generate email verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, phone } = req.body

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' })
    }

    // Generate verification token
    const verificationToken = generateVerificationToken()
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const user = await User.create({
      name,
      email,
      phone,
      password,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    })

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, name)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message)
      // Continue even if email fails - user can resend later
    }

    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}


exports.login = async (req, res) => {
  try {
    const { email } = req.query

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' })
    }
    let isExist = false;

    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.json({
        success: true,
        isExist,
        message: 'User not found'
      })
    }
    // Generate static 6-digit OTP
    const otpCode = '123456'

    // Log OTP to console (for development/testing)
    console.log(`\n📧 OTP Generated for ${email} : ${otpCode}\n`)

    // Delete any existing OTPs for this email and role
    await OTP.deleteMany({ email,  isUsed: false })

    // Create new OTP
    const otp = await OTP.create({
      email,
      otp: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    })

    try {
      await sendOTPEmail(email, otpCode)
      res.json({
        success: true,
        isExist: true,
        message: 'OTP sent to your email',
      })
    } catch (emailError) {
      const isEmailNotConfigured = emailError.message === 'EMAIL_NOT_CONFIGURED'
      const isDevelopment = process.env.NODE_ENV !== 'production'

      if (isEmailNotConfigured || isDevelopment) {
        console.log(`\n⚠️  Email not configured. OTP for ${email} : ${otpCode}\n`)
        return res.json({
          success: true,
          message: 'OTP generated (email not configured - check console)',
          isExist: true,
          otp: otpCode, // Include OTP in development mode
          isDevelopment: true,
        })
      }

      console.error('Failed to send OTP email:', emailError.message)
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please contact support.',
      })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}


exports.sendOTP = async (req, res) => {
  try {
    const { name, phone, email } = req.body

    if (!email || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide email and phone' })
    }

    const user = await User.findOne({ email })
    if (user) {
      return res.status(404).json({
        success: false,
        message: 'User exist please check email'
      })
    }

    const otpCode = '123456'

    // Log OTP to console (for development/testing)
    console.log(`\n📧 OTP Generated for ${email}: ${otpCode}\n`)

    // Delete any existing OTPs for this email and role
    await OTP.deleteMany({ email, isUsed: false })

    const createdUser = await User.create({
      name,
      email,
      phone
    })
    // Create new OTP
    const otp = await OTP.create({
      email,
      otp: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    })

    // Send OTP email
    try {
      await sendOTPEmail(email, otpCode)
      res.json({
        success: true,
        message: 'OTP sent to your email',
      })
    } catch (emailError) {
      // Check if error is due to email not being configured
      const isEmailNotConfigured = emailError.message === 'EMAIL_NOT_CONFIGURED'
      const isDevelopment = process.env.NODE_ENV !== 'production'

      if (isEmailNotConfigured || isDevelopment) {
        // In development mode or when email is not configured, return OTP in response
        console.log(`\n⚠️  Email not configured. OTP for ${email}: ${otpCode}\n`)
        return res.json({
          success: true,
          message: 'OTP generated (email not configured - check console)',
        })
      }

      // In production, don't expose OTP even if email fails
      console.error('Failed to send OTP email:', emailError.message)
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please contact support.',
      })
    }
  } catch (error) {
    console.error('Send OTP error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email, OTP, and role' })
    }

    const otpRecord = await OTP.findOne({
      email,
      otp,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    })

    if (!otpRecord) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP' })
    }

    // Mark OTP as used
    otpRecord.isUsed = true
    await otpRecord.save()

    // Get user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first at /auth/register'
      })
    }

    // Generate token
    const token = generateToken(user._id)

    res.json({
      success: true,
      token
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}


// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, profileImage, profileImagePublicId } = req.body

    // Build update object
    const updateData = {}
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (profileImage !== undefined) updateData.profileImage = profileImage
    if (profileImagePublicId !== undefined) updateData.profileImagePublicId = profileImagePublicId

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}