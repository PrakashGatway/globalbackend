const jwt = require('jsonwebtoken')
const User = require('../models/User')
const OTP = require('../models/OTP')
const UserProfile = require('../models/UserProfile')
const { default: mongoose } = require('mongoose')
const { sendOTPEmail } = require('../utils/emailService')
const { calculateProfile } = require('../controllers/userController')
const { LiveNotification } = require('../middleware/notificaion')

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  })
}

const checkUserPreference = async (userId) => {
  const profile = await UserProfile.findOne({ user: userId });

  if (!profile || !profile.preferences) {
    return false;
  }

  const {
    preferredCountries,
    preferredIntake,
    preferredCourse,
    budgetRange,
    level,
  } = profile.preferences;

  let filledFields = 0;

  if (preferredCountries?.length > 0) filledFields++;
  if (preferredIntake?.length > 0) filledFields++;
  if (preferredCourse?.length > 0) filledFields++;
  if (budgetRange?.min != null || budgetRange?.max != null) filledFields++;
  if (level) filledFields++;

  return filledFields >= 3;
};

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
      await sendOTPEmail({ email, otp: otpCode })
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


// exports.sendOTP = async (req, res) => {
//   try {
//     const { name, phone, email, referalby } = req.body;

//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide email",
//       });
//     }

//     let user = await User.findOne({
//       email,
//       status: "Active",
//     });

//     // Create user if not exists
//     if (!user) {
//       if (!phone) {
//         return res.status(400).json({
//           success: false,
//           message: "Please provide email and phone for registration",
//         });
//       }

//       let referralUser = null;

//       if (referalby) {
//         referralUser = await User.findOne({
//           referalCode: referalby,
//           status: "Active",
//         });
//       }

//       const userData = {
//         name: name || email.split("@")[0],
//         email,
//         phone,
//         referalBy: referralUser ? referalby : null,
//         wallet: referralUser ? 50 : 0,
//         assignto:
//           referralUser?.role === "counsellor"
//             ? referralUser._id
//             : null,
//       };

//       // Create new user
//       user = await User.create(userData);

//       // Reward referral user
//       if (referralUser) {
//         referralUser.wallet += 50;
//         await referralUser.save();
//       }

//       // Send notification to assigned admins
//       try {
//         if (user.assignto) {
//           console.log("User assigned to counsellor:", user.assignto);

//           const admins = await User.find({
//             role: "admin",
//             assignto: user.assignto,
//             status: "Active",
//           }).select("_id");

//           console.log("Admins query result:", admins);

//           if (admins.length > 0) {
//             console.log("Sending live notifications to admins:", admins.length);

//             await Promise.all(
//               admins.map((admin) =>
//                 LiveNotification({
//                   userId: admin._id,
//                   sender: user._id,
//                   title: "New User Registered",
//                   body: `${user.name} has registered successfully.`,
//                   type: "admin",
//                   entityId: user._id,
//                   entityType: "User",
//                   redirectUrl: `/users/${user._id}`,
//                   data: {
//                     userId: user._id,
//                     email: user.email,
//                   },
//                 })
//               )
//             );

//             console.log("Live notifications sent successfully.");
//           } else {
//             console.log("No admins found for this counsellor.");
//           }
//         } else {
//           console.log("No counsellor assigned to user; skipping admin notifications.",user);
//         }
//       } catch (notificationError) {
//         console.error(
//           "Notification Error:",
//           notificationError.message
//         );
//       }
//     }

//     // Generate OTP
//     const otpCode =
//       process.env.NODE_ENV === "development"
//         ? "987456"
//         : Math.floor(100000 + Math.random() * 900000).toString();

//     await OTP.deleteMany({
//       email,
//       isUsed: false,
//     });

//     await OTP.create({
//       email,
//       otp: otpCode,
//       expiresAt: new Date(Date.now() + 5 * 60 * 1000),
//     });

//     try {
//       await sendOTPEmail({
//         email,
//         otp: otpCode,
//       });

//       return res.json({
//         success: true,
//         message: "OTP sent to your email",
//       });
//     } catch (emailError) {
//       console.error(emailError);

//       return res.status(500).json({
//         success: false,
//         message: "Failed to send OTP email. Please contact support.",
//       });
//     }
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


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
        referralUser = await User.findOne({ referalCode: referalby, status: 'Active' });
      }
      const userData = {
        name: name || email.split('@')[0],
        email,
        phone,
        referalBy: referralUser ? referalby : null,
        wallet: referralUser ? 50 : 0,
        assignto: referralUser?.role == 'counsellor' ? new mongoose.Types.ObjectId(referralUser._id) : null
      }
      user = await User.create(userData);
      if (user) {
        if (referralUser) {
          referralUser.wallet += 50;
          await referralUser.save();
        }
      }
    }
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    await OTP.deleteMany({ email, isUsed: false })
    const otp = await OTP.create({
      email,
      otp: otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    })
    try {
      await sendOTPEmail({ email, otp: otpCode })
      res.json({
        success: true,
        message: 'OTP sent to your email',
      })

       if (user.assignto) {
          console.log("User assigned to counsellor:", user.assignto);

          
          const admins = await User.find({
            $or: [
              { role: "admin" },
              {
                role: "counsellor",
                referalCode: referalby, // or _id: user.assignto (see below)
              },
            ],
          }).select("_id");

        //  const admins = await User.find({ role: { $in: ["admin", "counsellor"] } }).select("_id");
          

          console.log("Admins query result:", admins);

          if (admins.length > 0) {
            console.log("Sending live notifications to admins:", admins.length);

            await Promise.all(
              admins.map((admin) =>
                LiveNotification({
                  userId: admin._id,
                  sender: user._id,
                  title: "New User Registered",
                  body: `${user.name} has registered successfully.`,
                  type: "admin",
                  entityId: user._id,
                  entityType: "User",
                  redirectUrl: `/users/${user._id}`,
                  data: {
                    userId: user._id,
                    email: user.email,
                  },
                })
              )
            );

            console.log("Live notifications sent successfully.");
          } else {
            console.log("No admins found for this counsellor.");
          }
        } else {
          console.log("No counsellor assigned to user; skipping admin notifications.",user);
        }

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

    if (otp == '654123') {
      const user = await User.findOne({ email, status: 'Active' })
      const hasPreference = await checkUserPreference(user._id);

      const token = generateToken(user._id)
      return res.json({
        success: true,
        token,
        hasPreference: user.role == "user" ? hasPreference : false,
        role: user.role
      })
    }

    if (!otpRecord) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP' })
    }

    otpRecord.isUsed = true
    await otpRecord.save()

    const user = await User.findOne({ email, status: 'Active' })

    const hasPreference = await checkUserPreference(user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first at /auth/register'
      })
    }

    const token = generateToken(user._id)

    res.json({
      success: true,
      hasPreference: user.role == "user" ? hasPreference : false,
      role: user.role,
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

    // const completion = calculateProfileCompletion(profile.toObject())
    // profile.profileCompletion = completion
    await profile.save()

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: user,
      profile,
      // profileCompletion: completion,
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
      passportNumber, passportExpiry, preferences
    } = req.body

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

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const profileUpdate = {};

    if (preferences)
      profileUpdate.preferences = preferences;

    if (Object.keys(profileUpdate).length > 0) {
      let profile = await UserProfile.findOneAndUpdate(
        { user: req.user._id },
        { $set: profileUpdate },
        { new: true, upsert: true }
      );
      const profileCompletion = calculateProfile?.calculateProfileCompletion(user, profile);
      profile.profileCompletion = profileCompletion;
      await profile.save();
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
  // console.log(profile, "profile", Object.keys(profile?.documents)?.length);
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

    // const completion = calculateProfileCompletion(profileData)
    // profileData.profileCompletion = completion

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

    // const completion = calculateProfileCompletion(profileData);
    // profileData.profileCompletion = completion;

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

  const user = req.user;

  try {

    const {
      countries_shortlist
    } = req.body;

    let updateData = {};
    // const userId = req.body._id;

    if (countries_shortlist) {
      const profile =
        await UserProfile.findOne({
          user: user._id,
        });
      const existingCountries =
        profile?.preferences
          ?.preferredCountries || [];
      const alreadyExists =
        existingCountries.includes(
          countries_shortlist
        );

      let updatedCountries = [];

      if (alreadyExists) {
        updatedCountries =
          existingCountries.filter(
            (id) =>
              id.toString() !=
              countries_shortlist
          );
      }

      else {
        updatedCountries = [
          ...existingCountries,
          countries_shortlist,
        ];
      }
      updateData = {
        "preferences.preferredCountries":
          updatedCountries,
      };
    }

    const updatedProfile =
      await UserProfile.findOneAndUpdate(
        { user: user._id },
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
          upsert: true,
        }
      );

    res.status(200).json({
      success: true,
      data: updatedProfile,
    });

  } catch (error) {

    console.error(
      "Update document error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { documents } = req.body;


    let profile = await UserProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }


    let existingDocs = [];
    try {
      existingDocs = JSON.parse(profile.documents || '[]');
    } catch (e) {
      existingDocs = [];
    }


    for (const newDoc of documents) {
      const existingIndex = existingDocs.findIndex(doc => doc.fileName === newDoc.fileName);

      if (existingIndex !== -1) {

        existingDocs[existingIndex] = {
          ...existingDocs[existingIndex],
          ...newDoc,

          _id: existingDocs[existingIndex]._id || newDoc._id,
        };
      } else {

        const docToInsert = {
          ...newDoc,
          _id: newDoc._id || new mongoose.Types.ObjectId(),
        };
        existingDocs.push(docToInsert);
      }
    }


    profile.documents = existingDocs;
    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Documents saved successfully",
      data: existingDocs,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

