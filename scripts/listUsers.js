const mongoose = require('mongoose')
require('dotenv').config()

const User = require('../models/User')

const listUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cway-admin')
    console.log('MongoDB Connected\n')

    // Get all users (without password)
    const users = await User.find().select('-password').sort({ createdAt: -1 })

    if (users.length === 0) {
      console.log('No users found in database.')
      process.exit(0)
    }

    console.log(`Total Users: ${users.length}\n`)
    console.log('='.repeat(100))

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User Details:`)
      console.log(`   ID: ${user._id}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Phone: ${user.phone}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Status: ${user.status}`)
      console.log(`   Created At: ${user.createdAt}`)
      console.log(`   Updated At: ${user.updatedAt}`)
      console.log('-'.repeat(100))
    })

    console.log('\n✅ Users listed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error listing users:', error)
    process.exit(1)
  }
}

// Run script
listUsers()
