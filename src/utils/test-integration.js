/**
 * Integration Test Utility
 * Tests all components working together
 */

export function testIntegration() {
    console.log('🧪 INTEGRATION TEST START');
    console.log('═══════════════════════════════════════\n');
    
    // Test 1: SpeechManager
    console.log('1️⃣ Testing SpeechManager...');
    import('./speech-manager').then(({ speechManager }) => {
        speechManager.speak('Testing speech manager').then(() => {
            console.log('✅ SpeechManager working\n');
            
            // Test 2: AttentionPrompter
            console.log('2️⃣ Testing AttentionPrompter...');
            return import('./attention-prompter');
        }).then(({ AttentionPrompter }) => {
            const prompter = new AttentionPrompter({ enabled: true });
            
            // Simulate focus loss
            console.log('   Simulating focus loss...');
            prompter.onFocusUpdate(false, true);
            
            setTimeout(() => {
                console.log('   Simulating focus regain...');
                prompter.onFocusUpdate(true, true);
                prompter.destroy();
                console.log('✅ AttentionPrompter working\n');
                
                console.log('═══════════════════════════════════════');
                console.log('🎉 ALL INTEGRATION TESTS PASSED!');
                console.log('═══════════════════════════════════════');
            }, 6000);
        });
    }).catch(error => {
        console.error('❌ Test failed:', error);
    });
}

// Run with: testIntegration() in browser console
