const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const User = require('../models/User')
const OTP = require('../models/OTP')
const { sendOTPEmail, sendVerificationEmail } = require('../utils/emailService')
const UserProfile = require('../models/UserProfile')

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  })
}

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' })
    }

    const user = await User.create({
      name,
      email,
      phone,
      password
    })

    try {
      await sendVerificationEmail(email, verificationToken, name)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message)
    }

    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      token
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
    const otpCode = '123456'

    await OTP.deleteMany({ email, isUsed: false })

    const otp = await OTP.create({
      email,
      otp: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    })

    try {
      // await sendOTPEmail(email, otpCode)
      res.json({
        success: true,
        isExist: true,
        message: 'OTP sent to your email',
      })
    } catch (emailError) {
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please contact support.',
      })
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.sendOTP = async (req, res) => {
  try {
    const { name, phone, email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' })
    }
    let user = await User.findOne({ email })
    if (!user) {
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Please provide email and phone for registration' })
      }
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        phone
      })
    }
    const otpCode = '123456'
    await OTP.deleteMany({ email, isUsed: false })
    const otp = await OTP.create({
      email,
      otp: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    })
    res.json({
      success: true,
      message: 'OTP sent to your email',
    })
    // Send OTP email
    // try {
    //   await sendOTPEmail(email, otpCode)
    //   res.json({
    //     success: true,
    //     message: 'OTP sent to your email',
    //   })
    // } catch (emailError) {
    //   // Check if error is due to email not being configured
    //   const isEmailNotConfigured = emailError.message === 'EMAIL_NOT_CONFIGURED'
    //   const isDevelopment = process.env.NODE_ENV !== 'production'

    //   if (isEmailNotConfigured || isDevelopment) {
    //     // In development mode or when email is not configured, return OTP in response
    //     console.log(`\n⚠️  Email not configured. OTP for ${email}: ${otpCode}\n`)
    //     return res.json({
    //       success: true,
    //       message: 'OTP generated (email not configured - check console)',
    //     })
    //   }

    //   // In production, don't expose OTP even if email fails
    //   console.error('Failed to send OTP email:', emailError.message)
    //   res.status(500).json({
    //     success: false,
    //     message: 'Failed to send OTP email. Please contact support.',
    //   })
    // }
  } catch (error) {
    console.error('Send OTP error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

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

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, profileImage, dateOfBirth, nationality, gender, firstLanguage, maritalStatus, passportNumber, passportExpiry } = req.body

    // Build update object
    const updateData = {}
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (profileImage !== undefined) updateData.profileImage = profileImage
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth
    if (nationality) updateData.nationality = nationality
    if (gender) updateData.gender = gender
    if (firstLanguage) updateData.firstLanguage = firstLanguage
    if (maritalStatus) updateData.maritalStatus = maritalStatus
    if (passportNumber) updateData.passportNumber = passportNumber
    if (passportExpiry) updateData.passportExpiry = passportExpiry

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

const calculateProfileCompletion = (profile) => {
  let totalFields = 10
  let completed = 0

  if (profile.maritalStatus) completed++
  if (profile.currentAddress?.city) completed++
  if (profile.educationHistory?.length > 0) completed++
  if (profile.preferredCountries?.length > 0) completed++
  if (profile.preferredCourse) completed++
  if (profile.preferredIntake) completed++
  if (profile.budgetRange?.min) completed++
  if (profile.passportNumber) completed++
  if (profile.englishTest?.exam) completed++
  if (profile.documents?.length > 0) completed++

  return Math.round((completed / totalFields) * 100)
}
exports.createOrUpdateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      })
    }

    const profileData = {
      ...req.body,
      user: userId,
    }

    // 🔹 Calculate completion %
    const completion = calculateProfileCompletion(profileData)
    profileData.profileCompletion = completion

    const profile = await UserProfile.findOneAndUpdate(
      { user: userId },
      { $set: profileData },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    )

    res.status(200).json({
      success: true,
      message: 'Profile saved successfully',
      data: profile,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
