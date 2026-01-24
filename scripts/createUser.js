const mongoose = require('mongoose')
require('dotenv').config()

const User = require('../models/User')

const createUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cway-admin')
    console.log('MongoDB Connected\n')

    const userData = {
      name: 'Akash Das',
      email: 'dasaakash84@gmail.com',
      phone: '+1234567890',
      password: 'password123', // Will be hashed automatically
      role: 'admin',
      status: 'Active',
      isEmailVerified: true,
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email })
    
    if (existingUser) {
      console.log(`✅ User with email ${userData.email} already exists`)
      console.log('\nExisting User Details:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`Name: ${existingUser.name}`)
      console.log(`Email: ${existingUser.email}`)
      console.log(`Phone: ${existingUser.phone}`)
      console.log(`Role: ${existingUser.role}`)
      console.log(`Status: ${existingUser.status}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // Update role if needed
      if (existingUser.role !== userData.role) {
        existingUser.role = userData.role
        await existingUser.save()
        console.log(`\n✅ Role updated to: ${userData.role}`)
      }
    } else {
      // Create new user
      const user = await User.create(userData)
      console.log('✅ User created successfully!')
      console.log('\nCreated User Details:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`Name: ${user.name}`)
      console.log(`Email: ${user.email}`)
      console.log(`Phone: ${user.phone}`)
      console.log(`Role: ${user.role}`)
      console.log(`Status: ${user.status}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    }

    console.log('\n📝 Login Credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Email: ${userData.email}`)
    console.log(`Role: ${userData.role}`)
    console.log(`Note: Use OTP login (password not needed)`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating user:', error)
    process.exit(1)
  }
}

// Run script
createUser()
