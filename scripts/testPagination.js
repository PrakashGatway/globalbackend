/**
 * Pagination Testing Script
 * Run: npm run test:pagination
 * Or: node scripts/testPagination.js
 * 
 * Prerequisites:
 * 1. Install axios: npm install axios
 * 2. Replace YOUR_JWT_TOKEN with actual token (get from login)
 * 3. Server should be running on port 5000
 * 4. Database should have some test data
 */

let axios
try {
  axios = require('axios')
} catch (error) {
  console.error('❌ Error: axios is not installed!')
  console.log('📦 Install it by running: npm install axios')
  process.exit(1)
}

const BASE_URL = 'http://localhost:5000'
const TOKEN = 'YOUR_JWT_TOKEN' // Replace with actual JWT token from login

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testEndpoint(name, url, expectedDataCount = null) {
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })

    const { data, pagination } = response.data

    // Validation
    const validations = []
    
    // Check data count matches itemsPerPage
    if (data.length === pagination.itemsPerPage) {
      validations.push('✅ Data count matches itemsPerPage')
    } else {
      validations.push(`⚠️  Data count (${data.length}) != itemsPerPage (${pagination.itemsPerPage})`)
    }

    // Check pagination structure
    const requiredFields = ['currentPage', 'totalPages', 'totalItems', 'itemsPerPage', 'hasNextPage', 'hasPrevPage']
    const missingFields = requiredFields.filter(field => !(field in pagination))
    if (missingFields.length === 0) {
      validations.push('✅ All pagination fields present')
    } else {
      validations.push(`❌ Missing fields: ${missingFields.join(', ')}`)
    }

    // Check hasNextPage logic
    if (pagination.currentPage < pagination.totalPages) {
      if (pagination.hasNextPage === true) {
        validations.push('✅ hasNextPage logic correct')
      } else {
        validations.push('❌ hasNextPage should be true')
      }
    } else {
      if (pagination.hasNextPage === false) {
        validations.push('✅ hasNextPage logic correct (last page)')
      } else {
        validations.push('❌ hasNextPage should be false (last page)')
      }
    }

    // Check hasPrevPage logic
    if (pagination.currentPage > 1) {
      if (pagination.hasPrevPage === true) {
        validations.push('✅ hasPrevPage logic correct')
      } else {
        validations.push('❌ hasPrevPage should be true')
      }
    } else {
      if (pagination.hasPrevPage === false) {
        validations.push('✅ hasPrevPage logic correct (first page)')
      } else {
        validations.push('❌ hasPrevPage should be false (first page)')
      }
    }

    // Check totalPages calculation
    const expectedTotalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage)
    if (pagination.totalPages === expectedTotalPages) {
      validations.push('✅ totalPages calculation correct')
    } else {
      validations.push(`❌ totalPages should be ${expectedTotalPages}, got ${pagination.totalPages}`)
    }

    log(`\n📊 ${name}`, 'cyan')
    log(`URL: ${url}`, 'blue')
    log(`Response Time: ${response.headers['x-response-time'] || 'N/A'}`, 'yellow')
    log(`\nPagination Info:`, 'yellow')
    console.log(JSON.stringify(pagination, null, 2))
    log(`\nData Count: ${data.length}`, 'yellow')
    log(`\nValidations:`, 'yellow')
    validations.forEach(v => log(`  ${v}`))

    return { success: true, pagination, dataCount: data.length }
  } catch (error) {
    log(`\n❌ ${name} - ERROR`, 'red')
    log(`URL: ${url}`, 'red')
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red')
      log(`Message: ${JSON.stringify(error.response.data)}`, 'red')
    } else {
      log(`Error: ${error.message}`, 'red')
    }
    return { success: false, error: error.message }
  }
}

async function runTests() {
  log('\n🧪 PAGINATION TESTING SUITE', 'cyan')
  log('='.repeat(50), 'cyan')

  if (TOKEN === 'YOUR_JWT_TOKEN') {
    log('\n⚠️  WARNING: Please replace YOUR_JWT_TOKEN with actual token!', 'yellow')
    log('Get token by logging in first.\n', 'yellow')
    return
  }

  const results = []

  // Test 1: Default pagination
  results.push(await testEndpoint(
    'Test 1: Default Pagination',
    `${BASE_URL}/api/users`
  ))

  // Test 2: Specific page and limit
  results.push(await testEndpoint(
    'Test 2: Page 2, Limit 20',
    `${BASE_URL}/api/users?page=2&limit=20`
  ))

  // Test 3: Sorting
  results.push(await testEndpoint(
    'Test 3: Sorting by name (asc)',
    `${BASE_URL}/api/users?page=1&limit=10&sortBy=name&sortOrder=asc`
  ))

  // Test 4: Last page
  results.push(await testEndpoint(
    'Test 4: Last Page',
    `${BASE_URL}/api/users?page=999&limit=10`
  ))

  // Test 5: Invalid page (should default to 1)
  results.push(await testEndpoint(
    'Test 5: Invalid Page (-1)',
    `${BASE_URL}/api/users?page=-1&limit=10`
  ))

  // Test 6: Large limit (should cap at 100)
  results.push(await testEndpoint(
    'Test 6: Large Limit (1000)',
    `${BASE_URL}/api/users?page=1&limit=1000`
  ))

  // Test 7: Other endpoints
  results.push(await testEndpoint(
    'Test 7: Wallets Pagination',
    `${BASE_URL}/api/wallets?page=1&limit=10`
  ))

  results.push(await testEndpoint(
    'Test 8: Universities Pagination',
    `${BASE_URL}/api/universities?page=1&limit=10`
  ))

  results.push(await testEndpoint(
    'Test 9: Courses Pagination',
    `${BASE_URL}/api/courses?page=1&limit=10`
  ))

  results.push(await testEndpoint(
    'Test 10: Countries Pagination',
    `${BASE_URL}/api/countries?page=1&limit=10`
  ))

  // Summary
  log('\n' + '='.repeat(50), 'cyan')
  log('📈 TEST SUMMARY', 'cyan')
  log('='.repeat(50), 'cyan')

  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  log(`\nTotal Tests: ${results.length}`, 'yellow')
  log(`✅ Passed: ${passed}`, 'green')
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green')

  if (failed === 0) {
    log('\n🎉 All tests passed!', 'green')
  } else {
    log('\n⚠️  Some tests failed. Check the errors above.', 'yellow')
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal Error: ${error.message}`, 'red')
  process.exit(1)
})
