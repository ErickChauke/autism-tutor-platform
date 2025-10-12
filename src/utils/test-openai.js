/**
 * OpenAI Connection Test Utility
 * Test if your API key is configured correctly
 */

export async function testOpenAIConnection() {
    const apiKey = process.env.REACT_APP_OPENAI_KEY;
    
    console.log('🔍 Testing OpenAI Connection...\n');
    
    if (!apiKey) {
        console.error('❌ No API key found in environment');
        console.log('💡 Add REACT_APP_OPENAI_KEY to your .env file');
        console.log('💡 App will use fallback content (which works great!)');
        return false;
    }
    
    console.log('✅ API Key found:', apiKey.substring(0, 20) + '...');
    console.log('🌐 Testing connection to OpenAI...\n');
    
    try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });
        
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ 
                role: "user", 
                content: "Say 'Connection successful!' in a friendly way" 
            }],
            max_tokens: 20
        });
        
        console.log('✅ OpenAI Connection Successful!');
        console.log('📝 Test Response:', response.choices[0].message.content);
        console.log('💰 Tokens used:', response.usage.total_tokens);
        console.log('\n✨ Your EducationEngine will use AI-generated content!\n');
        return true;
        
    } catch (error) {
        console.error('❌ OpenAI Connection Failed:', error.message);
        
        if (error.message.includes('401')) {
            console.error('🔑 API key is invalid or expired');
            console.log('💡 Get a new key from: https://platform.openai.com/api-keys');
        } else if (error.message.includes('429')) {
            console.error('⏱️  Rate limit exceeded');
            console.log('💡 Wait a moment and try again');
        } else if (error.message.includes('quota')) {
            console.error('💳 Quota exceeded or no credits');
            console.log('💡 Add credits at: https://platform.openai.com/account/billing');
        } else {
            console.error('🌐 Network or connection error');
        }
        
        console.log('\n💡 App will use fallback content instead');
        console.log('   (Fallback content works perfectly!)\n');
        return false;
    }
}

// Browser console usage:
// import { testOpenAIConnection } from './utils/test-openai';
// testOpenAIConnection();
