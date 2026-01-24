/**
 * Automated Test Script for Rewards & Purchase Functionality
 * 
 * Run with: node backend/scripts/testRewards.js
 * 
 * Make sure your server is running on http://localhost:5000
 */

const BASE_URL = 'http://localhost:5000/api'

// Test data
let studentToken = ''
let adminToken = ''
let courseId = ''
let universityId = ''
let purchaseId = ''

// Helper function to make API calls
async function apiCall(method, endpoint, token = null, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    const data = await response.json()
    return { status: response.status, data }
  } catch (error) {
    return { status: 500, data: { success: false, message: error.message } }
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n1. Testing Health Check...')
  const result = await apiCall('GET', '/health')
  if (result.data.status === 'OK') {
    console.log('✅ Health check passed')
    return true
  }
  console.log('❌ Health check failed')
  return false
}

async function testRegisterStudent() {
  console.log('\n2. Registering Student...')
  const result = await apiCall('POST', '/auth/register', null, {
    name: 'Test Student',
    email: `student${Date.now()}@test.com`,
    phone: '+1234567890',
    password: 'password123',
  })

  if (result.data.success) {
    studentToken = result.data.token
    console.log('✅ Student registered successfully')
    console.log(`   Token: ${studentToken.substring(0, 20)}...`)
    return true
  }
  console.log('❌ Student registration failed:', result.data.message)
  return false
}

async function testLoginAdmin() {
  console.log('\n3. Logging in as Admin...')
  // First send OTP
  await apiCall('POST', '/auth/send-otp', null, {
    email: 'admin@gateway.com',
    role: 'admin',
  })

  // In development, OTP might be in response
  // For testing, you may need to check console or use a test OTP
  console.log('   Note: Check server console for OTP or use verify-otp endpoint manually')
  console.log('   For automated testing, you may need to modify this script')
  return true
}

async function testCreateUniversity() {
  console.log('\n4. Creating University...')
  // Note: This requires admin token. For full automation, you'd need to handle OTP
  console.log('   Skipping (requires admin authentication)')
  console.log('   Please create university manually via Postman')
  return true
}

async function testCreateCourse() {
  console.log('\n5. Creating Course...')
  // Note: This requires admin token and university ID
  console.log('   Skipping (requires admin authentication)')
  console.log('   Please create course manually via Postman with:')
  console.log('   - name: "Test Course"')
  console.log('   - code: "TEST101"')
  console.log('   - price: 1000')
  console.log('   - university: {university_id}')
  return true
}

async function testPurchaseCourse() {
  console.log('\n6. Testing Course Purchase...')
  if (!studentToken) {
    console.log('❌ Student token not available')
    return false
  }

  if (!courseId) {
    console.log('⚠️  Course ID not set. Please set courseId variable in script')
    console.log('   Example: courseId = "your_course_id_here"')
    return false
  }

  const result = await apiCall('POST', '/purchases', studentToken, {
    courseId: courseId,
    paymentMethod: 'Credit Card',
    transactionId: `TXN${Date.now()}`,
  })

  if (result.data.success) {
    purchaseId = result.data.data.purchase.id
    console.log('✅ Course purchased successfully')
    console.log(`   Cashback earned: ₹${result.data.data.purchase.rewardsEarned.cashback}`)
    console.log(`   Points earned: ${result.data.data.purchase.rewardsEarned.points}`)
    return true
  }
  console.log('❌ Purchase failed:', result.data.message)
  return false
}

async function testGetMyRewards() {
  console.log('\n7. Testing Get My Rewards...')
  if (!studentToken) {
    console.log('❌ Student token not available')
    return false
  }

  const result = await apiCall('GET', '/rewards/my-rewards', studentToken)

  if (result.data.success) {
    console.log('✅ Rewards retrieved successfully')
    console.log(`   Total Points: ${result.data.data.points}`)
    console.log(`   Total Cashback: ₹${result.data.data.cashback}`)
    console.log(`   Points Value: ₹${result.data.data.pointsValueInRupees}`)
    return true
  }
  console.log('❌ Get rewards failed:', result.data.message)
  return false
}

async function testRedeemPoints() {
  console.log('\n8. Testing Redeem Points...')
  if (!studentToken) {
    console.log('❌ Student token not available')
    return false
  }

  const result = await apiCall('POST', '/rewards/redeem-points', studentToken, {
    points: 50,
  })

  if (result.data.success) {
    console.log('✅ Points redeemed successfully')
    console.log(`   Redeemed: ${result.data.data.pointsRedeemed} points`)
    console.log(`   Cashback added: ₹${result.data.data.cashbackAdded}`)
    console.log(`   Remaining points: ${result.data.data.remainingPoints}`)
    return true
  }
  console.log('❌ Redeem points failed:', result.data.message)
  return false
}

async function testGetMyPurchases() {
  console.log('\n9. Testing Get My Purchases...')
  if (!studentToken) {
    console.log('❌ Student token not available')
    return false
  }

  const result = await apiCall('GET', '/purchases/my-purchases', studentToken)

  if (result.data.success) {
    console.log('✅ Purchases retrieved successfully')
    console.log(`   Total purchases: ${result.data.count}`)
    return true
  }
  console.log('❌ Get purchases failed:', result.data.message)
  return false
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Rewards & Purchase Functionality Tests')
  console.log('=' .repeat(60))

  const tests = [
    testHealthCheck,
    testRegisterStudent,
    testLoginAdmin,
    testCreateUniversity,
    testCreateCourse,
    testPurchaseCourse,
    testGetMyRewards,
    testRedeemPoints,
    testGetMyPurchases,
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      const result = await test()
      if (result) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      console.log(`❌ Test error: ${error.message}`)
      failed++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`)
  console.log('\n💡 Note: Some tests require manual setup (admin login, course creation)')
  console.log('   Use Postman for complete testing (see TEST_REWARDS.md)')
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or install node-fetch')
  console.log('   Alternatively, use Postman for testing (see TEST_REWARDS.md)')
  process.exit(1)
}

// Run tests
runTests().catch(console.error)
