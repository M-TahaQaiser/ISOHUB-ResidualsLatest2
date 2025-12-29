#!/usr/bin/env node

// Comprehensive Email System Test
// Tests both pre-application and secured document portal emails

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testEmailSystem() {
  console.log('🧪 Starting Comprehensive Email System Test\n');

  const testCases = [
    {
      name: 'Pre-Application Email to cburnell@cocard.net',
      endpoint: '/api/pre-applications/send-form-link',
      data: {
        recipientEmail: 'cburnell@cocard.net',
        firstName: 'Cody',
        lastName: 'Burnell',
        senderName: 'ISOHub Test Administrator',
        organizationId: 'org-test'
      }
    },
    {
      name: 'Pre-Application Email to keanonbiz@gmail.com',
      endpoint: '/api/pre-applications/send-form-link',
      data: {
        recipientEmail: 'keanonbiz@gmail.com',
        firstName: 'Test',
        lastName: 'User',
        senderName: 'ISOHub Test Administrator',
        organizationId: 'org-test'
      }
    },
    {
      name: 'Secured Document Portal Email to cburnell@cocard.net',
      endpoint: '/api/secured-docs/send-upload-link',
      data: {
        recipientEmail: 'cburnell@cocard.net',
        recipientName: 'Cody Burnell',
        message: 'Testing secured document portal email delivery - cburnell@cocard.net',
        expirationDays: 7,
        maxDownloads: 3
      }
    },
    {
      name: 'Secured Document Portal Email to keanonbiz@gmail.com',
      endpoint: '/api/secured-docs/send-upload-link',
      data: {
        recipientEmail: 'keanonbiz@gmail.com',
        recipientName: 'Test User',
        message: 'Testing secured document portal email delivery - keanonbiz@gmail.com',
        expirationDays: 7,
        maxDownloads: 3
      }
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`📧 Testing: ${testCase.name}`);
    
    try {
      const response = await axios.post(`${BASE_URL}${testCase.endpoint}`, testCase.data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      const success = response.status === 200;
      results.push({
        test: testCase.name,
        success,
        status: response.status,
        data: response.data
      });

      console.log(`   ${success ? '✅' : '❌'} Status: ${response.status}`);
      console.log(`   📄 Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      
    } catch (error) {
      results.push({
        test: testCase.name,
        success: false,
        error: error.message
      });
      
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log(''); // Add spacing
    
    // Wait 2 seconds between tests to avoid overwhelming the email service
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('📊 EMAIL SYSTEM TEST SUMMARY');
  console.log('=' * 50);
  
  let passed = 0;
  let failed = 0;
  
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.test}`);
      passed++;
    } else {
      console.log(`❌ ${result.test} - ${result.error || 'Failed'}`);
      failed++;
    }
  });
  
  console.log(`\n📈 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All email tests passed! Both email systems are working correctly.');
  } else {
    console.log('⚠️  Some email tests failed. Check the logs above for details.');
  }
}

// Run the test
testEmailSystem().catch(console.error);