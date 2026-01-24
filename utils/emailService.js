const nodemailer = require('nodemailer')

// Check if email is configured
const isEmailConfigured = () => {
  const emailUser = process.env.EMAIL_USER
  const emailPass = process.env.EMAIL_PASS
  const isConfigured = emailUser && emailPass && 
         emailUser !== 'your-email@gmail.com' && 
         emailPass !== 'your-app-password' &&
         emailUser.trim() !== '' &&
         emailPass.trim() !== ''
  
  if (!isConfigured) {
    console.log('\n⚠️  EMAIL CONFIGURATION REQUIRED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('To enable email sending, add to your .env file:')
    console.log('EMAIL_USER=your-email@gmail.com')
    console.log('EMAIL_PASS=your-app-password (16-char Gmail app password)')
    console.log('EMAIL_FROM=noreply@cwayglobal.com (optional)')
    console.log('\nFor Gmail setup:')
    console.log('1. Enable 2-Step Verification: https://myaccount.google.com/security')
    console.log('2. Generate App Password: https://myaccount.google.com/apppasswords')
    console.log('3. Add credentials to .env and restart server')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  }
  
  return isConfigured
}

// Create transporter (using Gmail as example, configure with your email service)
const createTransporter = () => {
  // Check if email credentials are configured
  if (!isEmailConfigured()) {
    return null // Return null if not configured
  }

  // For development/testing, you can use Gmail or other services
  // For production, use proper SMTP configuration
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Alternative: Use SMTP directly
    // host: process.env.SMTP_HOST,
    // port: process.env.SMTP_PORT || 587,
    // secure: false,
    // auth: {
    //   user: process.env.SMTP_USER,
    //   pass: process.env.SMTP_PASS,
    // },
  })
}

// Send OTP email
const sendOTPEmail = async (email, otp, role) => {
  const transporter = createTransporter()
  
  // If email is not configured, skip sending in development mode
  if (!transporter) {
    const isDevelopment = process.env.NODE_ENV !== 'production'
    if (isDevelopment) {
      console.log(`\n⚠️  Email not configured. OTP for ${email} (${role}): ${otp}\n`)
      // Don't throw error in development - let the controller handle it
      throw new Error('EMAIL_NOT_CONFIGURED')
    } else {
      throw new Error('Email service is not configured. Please contact administrator.')
    }
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@cwayglobal.com',
      to: email,
      subject: 'Your Login OTP - C-way Global Admin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">C-way Global Admin Dashboard</h2>
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for login is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4f46e5; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p>Role: <strong>${role}</strong></p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `,
      text: `
        C-way Global Admin Dashboard
        
        Your One-Time Password (OTP) for login is: ${otp}
        
        This OTP is valid for 10 minutes.
        Role: ${role}
        
        If you didn't request this OTP, please ignore this email.
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ OTP Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message)
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.error('❌ Authentication failed. Check your EMAIL_USER and EMAIL_PASS in .env')
      console.error('   Make sure you\'re using a Gmail App Password, not your regular password.')
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('❌ Connection failed. Check your internet connection and email service settings.')
    }
    
    // For development, log OTP to console if email fails
    const isDevelopment = process.env.NODE_ENV !== 'production'
    if (isDevelopment) {
      console.log(`\n⚠️  Email sending failed. OTP for ${email} (${role}): ${otp}\n`)
      console.log('   (This OTP will still work - check console logs)\n')
    }
    throw new Error('Failed to send OTP email')
  }
}

// Send email verification email
const sendVerificationEmail = async (email, verificationToken, name) => {
  try {
    const transporter = createTransporter()
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@cwayglobal.com',
      to: email,
      subject: 'Verify Your Email - C-way Global Admin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">C-way Global Admin Dashboard</h2>
          <p>Hello ${name || 'there'},</p>
          <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #6b7280; word-break: break-all;">${verificationUrl}</p>
          <p>This verification link will expire in <strong>24 hours</strong>.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `,
      text: `
        C-way Global Admin Dashboard
        
        Hello ${name || 'there'},
        
        Thank you for registering! Please verify your email address by visiting this link:
        ${verificationUrl}
        
        This verification link will expire in 24 hours.
        
        If you didn't create an account, please ignore this email.
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Verification Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending verification email:', error)
    // For development, log verification link to console if email fails
    if (process.env.NODE_ENV === 'development') {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`
      console.log('⚠️  Email not configured. Verification link for', email, 'is:', verificationUrl)
    }
    throw new Error('Failed to send verification email')
  }
}

module.exports = {
  sendOTPEmail,
  sendVerificationEmail,
}
