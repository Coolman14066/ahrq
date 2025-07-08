const BACKEND_URL = 'http://localhost:3002';

// Simple fetch implementation using built-in Node.js fetch (Node 18+)
async function testAPI() {
  console.log('Testing AHRQ Dashboard AI Backend...\n');
  
  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
    console.log(`   Status: ${healthResponse.status}`);
    const contentType = healthResponse.headers.get('content-type');
    console.log(`   Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const healthData = await healthResponse.json();
      console.log('✓ Health Check:', healthData);
    } else {
      const text = await healthResponse.text();
      console.log('✗ Health Check returned non-JSON:', text.substring(0, 100));
    }
  } catch (error) {
    console.error('✗ Health Check failed:', error.message);
  }
  
  // Test 2: Data Stats
  console.log('\n2. Testing Data Statistics...');
  try {
    const statsResponse = await fetch(`${BACKEND_URL}/api/data/stats`);
    console.log(`   Status: ${statsResponse.status}`);
    
    if (statsResponse.headers.get('content-type')?.includes('application/json')) {
      const statsData = await statsResponse.json();
      console.log('✓ Data Stats:', {
        totalPublications: statsData.totalPublications,
        yearRange: statsData.yearRange,
        avgPolicyImpact: statsData.avgPolicyImpact?.toFixed(2)
      });
    } else {
      const text = await statsResponse.text();
      console.log('✗ Data Stats returned non-JSON:', text.substring(0, 100));
    }
  } catch (error) {
    console.error('✗ Data Stats failed:', error.message);
  }
  
  // Test 3: Simple Query
  console.log('\n3. Testing Data Query...');
  try {
    const queryResponse = await fetch(`${BACKEND_URL}/api/data/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'publications by Smith',
        context: {}
      })
    });
    console.log(`   Status: ${queryResponse.status}`);
    
    if (queryResponse.headers.get('content-type')?.includes('application/json')) {
      const queryData = await queryResponse.json();
      console.log('✓ Query Results:', {
        type: queryData.type,
        count: queryData.count,
        summary: queryData.summary
      });
    } else {
      const text = await queryResponse.text();
      console.log('✗ Query returned non-JSON:', text.substring(0, 100));
    }
  } catch (error) {
    console.error('✗ Data Query failed:', error.message);
  }
  
  // Test 4: Chat Message
  console.log('\n4. Testing Chat Message...');
  try {
    const chatResponse = await fetch(`${BACKEND_URL}/api/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is the total number of publications?',
        context: {
          activeView: 'overview',
          selectedFilters: {
            years: [2010, 2024],
            publicationTypes: [],
            usageTypes: [],
            domains: [],
            authors: []
          },
          currentMetrics: {
            totalPublications: 0,
            avgPolicyImpact: 0,
            avgQualityScore: 0,
            topAuthors: [],
            emergingTrends: []
          }
        },
        sessionId: 'test-session'
      })
    });
    console.log(`   Status: ${chatResponse.status}`);
    
    if (chatResponse.headers.get('content-type')?.includes('application/json')) {
      const chatData = await chatResponse.json();
      console.log('✓ Chat Response:', {
        hasMessage: !!chatData.message,
        messagePreview: chatData.message?.substring(0, 100) + '...',
        hasActions: !!chatData.actions,
        hasSuggestions: !!chatData.suggestions
      });
    } else {
      const text = await chatResponse.text();
      console.log('✗ Chat returned non-JSON:', text.substring(0, 100));
    }
  } catch (error) {
    console.error('✗ Chat Message failed:', error.message);
  }
  
  // Test 5: Schema
  console.log('\n5. Testing Data Schema...');
  try {
    const schemaResponse = await fetch(`${BACKEND_URL}/api/data/schema`);
    console.log(`   Status: ${schemaResponse.status}`);
    
    if (schemaResponse.headers.get('content-type')?.includes('application/json')) {
      const schemaData = await schemaResponse.json();
      console.log('✓ Schema loaded:', {
        hasPublicationSchema: !!schemaData.publication,
        fieldCount: Object.keys(schemaData.publication?.fields || {}).length
      });
    } else {
      const text = await schemaResponse.text();
      console.log('✗ Schema returned non-JSON:', text.substring(0, 100));
    }
  } catch (error) {
    console.error('✗ Schema failed:', error.message);
  }
  
  // Test 6: Check if we're getting an error page
  console.log('\n6. Testing Root Path...');
  try {
    const rootResponse = await fetch(`${BACKEND_URL}/`);
    const rootText = await rootResponse.text();
    if (rootText.includes('<!DOCTYPE') || rootText.includes('<html')) {
      console.log('⚠️  Server is returning HTML (possibly an error page or proxy)');
      console.log('   This might indicate:');
      console.log('   - Server is behind a proxy that returns error pages');
      console.log('   - Server crashed and a default error page is shown');
      console.log('   - Wrong port or URL');
    } else {
      console.log('✓ Root path returns:', rootText.substring(0, 50));
    }
  } catch (error) {
    console.error('✗ Root test failed:', error.message);
  }
  
  console.log('\n✅ API tests completed!');
  
  // Additional diagnostics
  console.log('\n📋 Diagnostics:');
  console.log('- If all tests show HTML responses, the server might not be running');
  console.log('- If you see "ECONNREFUSED", the server is not listening on port 3001');
  console.log('- If you see JSON parse errors, check the response content above');
}

// Run tests
testAPI().catch(console.error);