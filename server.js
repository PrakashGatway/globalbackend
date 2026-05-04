const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()
const path = require("path");
const fs = require("fs");

const app = express()

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/universities', require('./routes/universities'))
app.use('/api/courses', require('./routes/courses'))
app.use('/api/countries', require('./routes/countries'))
app.use('/api/contactus', require('./routes/contactus'))
app.use('/api', require('./routes/testimonialsRoutes'))
app.use('/api/scholarships', require('./routes/scholarshipRoutes'))
app.use('/api/support', require('./routes/support'))
app.use('/api/purchases', require('./routes/purchases'))
app.use('/api/rewards', require('./routes/rewards'))
app.use('/api/coupons', require('./routes/coupons'))
app.use('/api/applications', require('./routes/applications'))
app.use('/api/upload', require('./routes/upload'))
app.use('/api/page-information', require('./routes/pageInformation'))
app.use('/api/blogs', require('./routes/blogRoutes'))
app.use('/api/subjects', require('./routes/subjectRoutes'))
app.use('/api/communication', require('./routes/applicationCom'))

app.use("/api/dashboard", require("./routes/dashboardRoutes"))

app.use("/api", require("./routes/enquiry"))

app.use('/api/notifications', require('./routes/notication'))


app.get("/api/page-json", (req, res) => {
  try {
    const filePath = path.join(__dirname, "src/pages.json");
    const jsonData = fs.readFileSync(filePath, "utf-8");

    res.json(JSON.parse(jsonData));
  } catch (error) {
    res.status(500).json({ error: "Failed to read JSON file" });
  }
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

// Database connection
const connectDB = async () => {
  if (process.env.MONGODB_URI === undefined) {
    console.error('MONGODB_URI is not defined in environment variables')
    process.exit(1)
  }
  try {
    // const conn = await mongoose.connect(process.env.MONGODB_URI || '').
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
        family: 4
      });

    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('Database connection error:', error)
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
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  })
})

const PORT = 5000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Local access: http://localhost:${PORT}`)
})