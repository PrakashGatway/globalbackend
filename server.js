const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/wallets', require('./routes/wallets'))
app.use('/api/universities', require('./routes/universities'))
app.use('/api/courses', require('./routes/courses'))
app.use('/api/programs', require('./routes/programs'))
app.use('/api/countries', require('./routes/countries'))
app.use('/api/support', require('./routes/support'))
app.use('/api/purchases', require('./routes/purchases'))
app.use('/api/rewards', require('./routes/rewards'))
app.use('/api/coupons', require('./routes/coupons'))
app.use('/api/applications', require('./routes/applications'))
app.use('/api/upload', require('./routes/upload'))
app.use('/api/page-information', require('./routes/pageInformation'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cway-admin')
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('Database connection error:', error.message)
    process.exit(1)
  }
}

// Connect to database
connectDB()

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  })
})

// 404 handler
app.use((req, res) => {
  console.error(`[404] Route not found: ${req.method} ${req.path}`)
  console.error(`Request headers:`, req.headers)
  console.error(`Request body:`, req.body)
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    path: req.path,
    method: req.method
  })
})

const PORT = process.env.PORT || 5000

// Listen on all network interfaces (0.0.0.0) to allow access from other devices on the network
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Access from network: http://<your-ip>:${PORT}`)
  console.log(`Local access: http://localhost:${PORT}`)
})
