import React, { useEffect, useRef } from 'react';

// SIMPLE TEST: Does voice work at all?
export default function VoiceTest() {
    const synthRef = useRef(window.speechSynthesis);
    const hasSpoken = useRef(false);

    useEffect(() => {
        // Test voice 3 seconds after mount
        if (!hasSpoken.current) {
            hasSpoken.current = true;
            
            setTimeout(() => {
                console.log('🧪 VOICE TEST: About to speak...');
                
                const utterance = new SpeechSynthesisUtterance('Voice test working!');
                utterance.rate = 0.9;
                utterance.pitch = 1.1;
                utterance.volume = 0.9;
                
                utterance.onstart = () => console.log('✅ Voice started!');
                utterance.onend = () => console.log('✅ Voice ended!');
                utterance.onerror = (e) => console.error('❌ Voice error:', e);
                
                synthRef.current.speak(utterance);
            }, 3000);
        }
    }, []);

    return null; // Invisible component
}
