const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const User = require('../models/User')

// Default gateway users
const defaultUsers = [
  {
    name: 'Admin User',
    email: 'admin@gateway.com',
    phone: '+1234567890',
    password: 'admin123',
    role: 'admin',
    status: 'Active',
  },
  {
    name: 'Manager User',
    email: 'manager@gateway.com',
    phone: '+1234567891',
    password: 'manager123',
    role: 'manager',
    status: 'Active',
  },
  {
    name: 'Counsellor User',
    email: 'counsellor@gateway.com',
    phone: '+1234567892',
    password: 'counsellor123',
    role: 'counsellor',
    status: 'Active',
  },
]

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cway-admin')
    console.log('MongoDB Connected')

    // Clear existing gateway users to recreate them with correct passwords
    await User.deleteMany({ email: { $in: defaultUsers.map(u => u.email) } })

    // Create users
    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ email: userData.email })
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`)
      } else {
        // Create user - password will be hashed by User model's pre-save hook
        const user = await User.create(userData)
        console.log(`✓ Created user: ${user.email} (${user.role})`)
      }
    }

    console.log('\n✅ Seed completed successfully!')
    console.log('\nDefault Gateway Users:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    defaultUsers.forEach((user) => {
      console.log(`Role: ${user.role.toUpperCase()}`)
      console.log(`Email: ${user.email}`)
      console.log(`Password: ${user.password}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    })

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding users:', error)
    process.exit(1)
  }
}

// Run seed
seedUsers()
