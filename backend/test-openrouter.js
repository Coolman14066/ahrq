import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "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",
});

async function testOpenRouter() {
  console.log('Testing OpenRouter API...\n');
  
  try {
    console.log('Sending test message to Gemini 2.5 Flash Lite...');
    
    const completion = await client.chat.completions.create({
      model: "google/gemini-2.5-flash-lite-preview-06-17",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Respond in JSON format with a 'message' field."
        },
        {
          role: "user",
          content: "Say hello and confirm you're working. What model are you?"
        }
      ],
      extra_headers: {
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "AHRQ Dashboard Test",
      },
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: "json_object" }
    });
    
    console.log('✅ Success! Response received:');
    console.log(completion.choices[0].message.content);
    
    // Try parsing as JSON
    try {
      const parsed = JSON.parse(completion.choices[0].message.content);
      console.log('\nParsed JSON:', parsed);
    } catch (e) {
      console.log('\nNote: Response is not valid JSON');
    }
    
  } catch (error) {
    console.error('❌ Error testing OpenRouter:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testOpenRouter();