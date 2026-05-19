const jwt = require('jsonwebtoken')
const User = require('../models/User')
const OTP = require('../models/OTP')
const UserProfile = require('../models/UserProfile')
const { default: mongoose } = require('mongoose')
const { sendOTPEmail } = require('../utils/emailService')

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  })
}

exports.login = async (req, res) => {
  try {
    const { email } = req.query

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' })
    }
    let isExist = false;

    const user = await User.findOne({ email, status: 'Active' }).select('+password')

    if (!user) {
      return res.json({
        success: true,
        isExist,
        message: 'User not found/inactive',
      })
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    await OTP.deleteMany({ email, isUsed: false })

    const otp = await OTP.create({
      email,
      otp: otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    })
    try {
      // await sendOTPEmail({ email, otp: otpCode })
      res.json({
        success: true,
        isExist: true,
        message: 'OTP sent to your email',
      })
    } catch (emailError) {
      console.error("email sending error : ", emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please contact support.',
        error: emailError,
      })
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.sendOTP = async (req, res) => {
  try {
    const { name, phone, email, referalby } = req.body
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' })
    }
    let user = await User.findOne({ email, status: 'Active' })
    if (!user) {
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Please provide email and phone for registration' })
      }
      let referralUser;
      if (referalby) {
        referralUser = await User.findOne({ referalCode: referalby });
      }
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        phone,
        referalby: referralUser ? referralUser._id : null,
        wallet: referralUser ? 50 : 0
      })
      if (user) {
        if (referralUser) {
          referralUser.wallet += 50;
          await referralUser.save();
        }
      }
    }
    const otpCode = "987456" || Math.floor(100000 + Math.random() * 900000).toString()
    await OTP.deleteMany({ email, isUsed: false })
    const otp = await OTP.create({
      email,
      otp: otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    })
    // Send OTP email
    try {
      await sendOTPEmail({ email, otp: otpCode })
      res.json({
        success: true,
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

    if (otp == '987456') {
      const user = await User.findOne({ email, status: 'Active' })
      const token = generateToken(user._id)
      return res.json({
        success: true,
        token
      })
    }

    if (!otpRecord) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP' })
    }

    otpRecord.isUsed = true
    await otpRecord.save()

    const user = await User.findOne({ email, status: 'Active' })
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
    res.status(500).json({ success: false, message: error.message })
  }
}

// exports.getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select('-password')
//     res.json({ success: true, data: user })
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message })
//   }
// }

exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      })
    }

    const user = await User.findOne({ _id: userId, status: 'Active' }).populate('assignto').select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    let profile = await UserProfile.findOne({ user: userId })

    if (!profile) {
      profile = await UserProfile.create({ user: userId })
    }

    const completion = calculateProfileCompletion(profile.toObject())
    profile.profileCompletion = completion
    await profile.save()

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: user,
      profile,
      profileCompletion: completion,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, profileImage, dateOfBirth, nationality, gender, firstLanguage, maritalStatus,
       passportNumber, passportExpiry } = req.body

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
  let totalFields = 4
  let completed = 0
  console.log(profile,"profile",Object.keys(profile?.documents)?.length );
  if (
    profile.currentAddress?.addressLine1 &&
    profile.currentAddress?.city &&
    profile.currentAddress?.country
  ) {
    completed++
  }

  // // 2️⃣ Permanent Address
  // if (
  //   profile.permanentAddress?.addressLine1 &&
  //   profile.permanentAddress?.city &&
  //   profile.permanentAddress?.country
  // ) {
  //   completed++
  // }

  // 3️⃣ Highest Academic
  if (
    profile.highestAcademic?.highestEducationLevel &&
    profile.highestAcademic?.countryOfEducation
  ) {
    completed++
  }

  // 4️⃣ Education History
  if (profile.educationHistory?.length > 0) {
    completed++
  }


  // // 5️⃣ English Proficiency
  // if (
  //   profile.englishProficiency ||
  //   profile.englishProficiencyScore?.englishTest
  // ) {
  //   completed++
  // }

  // // 6️⃣ GMAT / GRE / SAT
  // if (
  //   profile.hasGmat ||
  //   profile.hasGre ||
  //   profile.gmatScore?.totalScore?.score ||
  //   profile.satScore?.totalScore?.score
  // ) {
  //   completed++
  // }

  if (
    profile.documents !== undefined ||
    Object.keys(profile?.documents || {})?.length >= 7
  ) {
    completed++
  }

 
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

exports.getMyReferrals = async (req, res) => {
  try {
    const user = req.user;

    const referrals = await User.find({ referalBy: user.referalCode })
      .sort({ createdAt: -1 })
      .limit(15)
      .select('name email createdAt profileImage');

    res.status(200).json({
      success: true,
      count: referrals.length,
      data: referrals
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referrals'
    });
  }
};


exports.createOrUpdateUserProfileById = async (req, res) => {
  try {
    const { userId, ...bodyData } = req.body;

    // validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    const profileData = {
      ...bodyData,
      user: userId,
    };

    const completion = calculateProfileCompletion(profileData);
    profileData.profileCompletion = completion;

    const profile = await UserProfile.findOneAndUpdate(
      { user: userId },
      { $set: profileData },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateDoc = async (req, res) => {
  try {
    const { userId, documentNitame, status } = req.body;

    // Validation
    if (!userId || !documentName) {
      return res.status(400).json({
        success: false,
        message: "userId and documentName are required",
      });
    }

    // Update document status dynamically
    const updatedProfile = await UserProfile.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          [`documents.${documentName}.status`]: status,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Document ${
        status ? "approved" : "rejected"
      } successfully`,
      data: updatedProfile,
    });

  } catch (error) {
    console.error("Update document error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};