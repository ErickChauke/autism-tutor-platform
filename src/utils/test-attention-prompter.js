/**
 * Test utility for AttentionPrompter
 * Run this in browser console to test prompt system
 */

import { AttentionPrompter } from './attention-prompter';

export function testAttentionPrompter() {
    console.log('🧪 Testing AttentionPrompter...\n');
    
    const prompter = new AttentionPrompter({
        enabled: true,
        delayBeforePrompt: 2000,  // Shorter for testing
        timeBetweenPrompts: 5000   // Shorter for testing
    });
    
    console.log('✅ AttentionPrompter created');
    console.log('📝 Simulating focus loss in 1 second...\n');
    
    setTimeout(() => {
        console.log('❌ Focus lost!');
        prompter.onFocusLost();
        console.log('⏱️  Waiting 2 seconds for prompt...');
    }, 1000);
    
    setTimeout(() => {
        console.log('✅ Focus regained!');
        prompter.onFocusRegained();
        console.log('🎉 You should have heard encouragement!\n');
    }, 5000);
    
    setTimeout(() => {
        console.log('🧹 Cleaning up...');
        prompter.destroy();
        console.log('✅ Test complete!\n');
    }, 7000);
}

// Usage in browser console:
// import { testAttentionPrompter } from './utils/test-attention-prompter';
// testAttentionPrompter();
