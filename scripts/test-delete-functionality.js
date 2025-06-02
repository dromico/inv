#!/usr/bin/env node

/**
 * Test script to verify the subcontractor delete functionality
 * Run this script to test the delete API endpoint
 */

const https = require('https');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Change this to your deployment URL if testing production
const TEST_ENDPOINT = '/api/admin/subcontractors/delete';

// Test data - replace with actual subcontractor ID you want to test with
const TEST_SUBCONTRACTOR_ID = 'replace-with-actual-subcontractor-id';

/**
 * Make HTTP request
 */
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: JSON.parse(body)
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Test the delete functionality
 */
async function testDeleteFunctionality() {
  console.log('🧪 Testing Subcontractor Delete Functionality');
  console.log('=' .repeat(50));

  try {
    // Test 1: Missing authentication (should fail with 401)
    console.log('\n📋 Test 1: Missing Authentication');
    const options1 = {
      hostname: 'localhost',
      port: 3000,
      path: TEST_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const response1 = await makeRequest(options1, {
      subcontractorId: TEST_SUBCONTRACTOR_ID
    });

    console.log(`Status: ${response1.statusCode}`);
    console.log(`Response: ${JSON.stringify(response1.body, null, 2)}`);
    
    if (response1.statusCode === 401) {
      console.log('✅ Test 1 PASSED: Correctly rejected unauthenticated request');
    } else {
      console.log('❌ Test 1 FAILED: Should have returned 401');
    }

    // Test 2: Invalid subcontractor ID (should fail with 400 or 404)
    console.log('\n📋 Test 2: Invalid Subcontractor ID');
    // This test would require authentication cookies, so we'll skip for now
    console.log('⏭️  Skipping - requires authentication setup');

    // Test 3: Valid deletion (would require proper authentication)
    console.log('\n📋 Test 3: Valid Deletion');
    console.log('⏭️  Skipping - requires authentication setup');

    console.log('\n🎯 Manual Testing Required');
    console.log('To fully test the delete functionality:');
    console.log('1. Log in as an admin user in your browser');
    console.log('2. Navigate to /dashboard/admin/subcontractors');
    console.log('3. Try deleting a test subcontractor');
    console.log('4. Check browser console and server logs for detailed output');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

/**
 * Check if server is running
 */
async function checkServerHealth() {
  console.log('🏥 Checking server health...');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/health-check',
      method: 'GET'
    };

    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Server is running');
      return true;
    } else {
      console.log('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('💡 Start the server with: npm run dev');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Subcontractor Delete Functionality Test');
  console.log('==========================================\n');

  // Check if server is running
  const serverRunning = await checkServerHealth();
  
  if (!serverRunning) {
    console.log('\n❌ Cannot run tests - server is not accessible');
    process.exit(1);
  }

  // Run tests
  await testDeleteFunctionality();

  console.log('\n✨ Test completed');
  console.log('\n📝 Next Steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Log in as an admin user');
  console.log('3. Test the delete functionality manually in the browser');
  console.log('4. Monitor console logs for detailed debugging information');
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testDeleteFunctionality,
  checkServerHealth
};
