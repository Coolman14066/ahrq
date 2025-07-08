console.log('🔍 Quick Backend Diagnostic\n');

// Test 1: Is the server actually running?
console.log('1. Testing if server is reachable...');
fetch('http://localhost:3002/api/health')
  .then(res => {
    console.log(`   ✓ Server responded with status: ${res.status}`);
    console.log(`   Content-Type: ${res.headers.get('content-type')}`);
    return res.text();
  })
  .then(text => {
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      console.log('   ❌ Got HTML response - server is NOT running properly');
      console.log('   This usually means:');
      console.log('   - The backend server is not running');
      console.log('   - Something else is running on port 3001');
      console.log('\n   👉 Solution: Make sure to run "npm run dev" in the backend folder');
    } else {
      try {
        const json = JSON.parse(text);
        console.log('   ✅ Server is running correctly!');
        console.log('   Response:', json);
      } catch (e) {
        console.log('   ⚠️  Server responded but not with JSON:', text.substring(0, 100));
      }
    }
  })
  .catch(err => {
    console.log('   ❌ Cannot connect to server');
    console.log('   Error:', err.message);
    console.log('\n   👉 Solution: Start the backend with "npm run dev" in the backend folder');
  });

// Test 2: Check the OpenRouter API key
console.log('\n2. Testing OpenRouter API key...');
import('openai').then(({ OpenAI }) => {
  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: "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",
  });
  
  return client.chat.completions.create({
    model: "google/gemini-2.5-flash",
    messages: [{ role: "user", content: "Say 'API working'" }],
    max_tokens: 10
  });
})
.then(completion => {
  console.log('   ✅ OpenRouter API key is valid!');
  console.log('   Response:', completion.choices[0].message.content);
})
.catch(err => {
  console.log('   ❌ OpenRouter API error:', err.message);
});

console.log('\n📋 Next Steps:');
console.log('1. If server is not running: cd backend && npm run dev');
console.log('2. If API key fails: Check the error message above');
console.log('3. Once both work, the chatbot should function!\n');