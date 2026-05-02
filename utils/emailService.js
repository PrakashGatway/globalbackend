const nodemailer = require('nodemailer')
const isSMTPConfigured = () => {
  return (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  )
}

const createTransporter = () => {
  if (!isSMTPConfigured()) {
    console.log('❌ SMTP NOT CONFIGURED')
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: process.env.SMTP_PORT || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const otpTemplate = ({ otp, role, appName = 'Ooshas Global' }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">
      
      <h2 style="color:#4f46e5;">${appName}</h2>

      <p>Hello,</p>

      <p>Your One-Time Password (OTP) is:</p>

      <div style="background:#f3f4f6; padding:20px; text-align:center; margin:20px 0;">
        <h1 style="font-size:32px; letter-spacing:5px; margin:0;">${otp}</h1>
      </div>

      <p>This OTP is valid for <strong>5 minutes</strong>.</p>

      <p>If you did not request this, please ignore this email.</p>

      <hr style="margin:20px 0;" />

      <p style="font-size:12px; color:#999;">
        This is an automated email. Do not reply.
      </p>
    </div>
  `
}

const sendOTPEmail = async ({ email, otp, role }) => {
  const transporter = createTransporter()

  if (!transporter) {
    throw new Error('SMTP_NOT_CONFIGURED',transporter)
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Your OTP Code',
    html: otpTemplate({ otp }),
    text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    // console.log('✅ OTP Email Sent:', info)

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error('❌ Email Error:', error)
    throw new Error('EMAIL_SEND_FAILED',error);
  }
}

module.exports = {
  sendOTPEmail,
}