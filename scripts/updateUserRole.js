const mongoose = require('mongoose')
require('dotenv').config()

const User = require('../models/User')

const updateUserRole = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cway-admin')
    console.log('MongoDB Connected\n')

    const email = 'dasaakash84@gmail.com'
    const newRole = 'admin'

    // Find and update user
    const user = await User.findOneAndUpdate(
      { email },
      { role: newRole },
      { new: true }
    )

    if (!user) {
      console.log(`❌ User with email ${email} not found`)
      process.exit(1)
    }

    console.log('✅ User role updated successfully!')
    console.log('\nUpdated User Details:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Name: ${user.name}`)
    console.log(`Email: ${user.email}`)
    console.log(`Phone: ${user.phone}`)
    console.log(`Role: ${user.role}`)
    console.log(`Status: ${user.status}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error updating user role:', error)
    process.exit(1)
  }
}

// Run script
updateUserRole()
