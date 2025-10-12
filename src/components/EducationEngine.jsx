import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import { lipSyncController } from '../utils/lip-sync-controller';
import { speechTimingEstimator } from '../utils/speech-timing-estimator';
import '../styles/EducationEngine.css';

const ATTENTION_PROMPTS = [
    "Hey, look at me!",
    "Can you look at my eyes?",
    "I'm over here!",
    "Let's make eye contact!",
    "Look at me, please!",
];

const ENCOURAGEMENT = [
    "Great! You're back!",
    "Perfect! Thank you!",
    "Awesome! Good job!",
];

const fallbackContent = {
    education: {
        animals: "Let's learn about animals. Did you know elephants are very smart?",
        space: "Space is amazing! Did you know the sun is a star?",
        colors: "Colors are everywhere! Red, blue, and yellow are primary colors.",
        numbers: "Let's count together! One, two, three, four, five!"
    }
};

export default function EducationEngine({ 
    eyeContactScore = 0, 
    mode = 'prt',
    hasEyeContact = false,
    faceDetected = false,
    voiceRemindersEnabled = true
}) {
    const [currentContent, setCurrentContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [useAI, setUseAI] = useState(false);
    const [speechEnabled, setSpeechEnabled] = useState(true);
    
    // Refs
    const openaiRef = useRef(null);
    const speechSynthRef = useRef(window.speechSynthesis);
    const lastScoreMilestone = useRef(0);
    
    // Simplified tracking - just track eye contact!
    const lastPromptTime = useRef(0);
    const noEyeContactTimer = useRef(null);
    const usedPrompts = useRef([]);
    const lastEyeContactValue = useRef(hasEyeContact);

    // Initialize OpenAI
    useEffect(() => {
        if (process.env.REACT_APP_OPENAI_KEY) {
            openaiRef.current = new OpenAI({
                apiKey: process.env.REACT_APP_OPENAI_KEY,
                dangerouslyAllowBrowser: true
            });
            setUseAI(true);
            console.log('✅ OpenAI initialized');
        } else {
            console.log('ℹ️ Using fallback');
        }
    }, []);

    // VOICE FUNCTION
    const speakNow = (text, type = 'normal') => {
        console.log(`🔊 Speaking (${type}):`, text);
        
        if (!text) return;
        
        // Cancel ongoing
        speechSynthRef.current.cancel();
        lipSyncController.stop();
        speechTimingEstimator.stop();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        
        utterance.onstart = () => console.log('  ✅ Started');
        utterance.onend = () => console.log('  ✅ Ended');
        utterance.onerror = (e) => console.error('  ❌ Error:', e);
        
        speechTimingEstimator.start(text, 0.9);
        lipSyncController.start(utterance);
        speechSynthRef.current.speak(utterance);
    };

    // ============================================
    // SIMPLIFIED EYE CONTACT MONITORING
    // ============================================
    useEffect(() => {
        // Skip if disabled
        if (!voiceRemindersEnabled || mode === 'assessment' || mode === 'research') {
            return;
        }

        console.log(`👁️ Eye Contact: ${hasEyeContact ? 'YES ✅' : 'NO ❌'} | Face: ${faceDetected ? 'YES' : 'NO'}`);

        // ==== LOST EYE CONTACT ====
        if (!hasEyeContact && lastEyeContactValue.current) {
            console.log('🔴 EYE CONTACT LOST → Starting 4s timer');
            
            // Clear any existing timer
            if (noEyeContactTimer.current) {
                clearTimeout(noEyeContactTimer.current);
            }
            
            // Start 4-second timer
            noEyeContactTimer.current = setTimeout(() => {
                console.log('⏰ 4 SECONDS NO EYE CONTACT!');
                
                // Check cooldown
                const now = Date.now();
                if (now - lastPromptTime.current < 10000) {
                    console.log('   ⏭️ Cooldown active (10s between prompts)');
                    return;
                }
                
                // Get random prompt
                if (usedPrompts.current.length >= ATTENTION_PROMPTS.length) {
                    usedPrompts.current = [];
                }
                const available = ATTENTION_PROMPTS.filter(p => !usedPrompts.current.includes(p));
                const prompt = available[Math.floor(Math.random() * available.length)];
                usedPrompts.current.push(prompt);
                
                console.log('   🔔 Prompting:', prompt);
                speakNow(prompt, 'attention');
                lastPromptTime.current = now;
                
            }, 4000);
        }
        
        // ==== REGAINED EYE CONTACT ====
        else if (hasEyeContact && !lastEyeContactValue.current) {
            console.log('🟢 EYE CONTACT REGAINED');
            
            // Clear timer
            if (noEyeContactTimer.current) {
                console.log('   Clearing timer');
                clearTimeout(noEyeContactTimer.current);
                noEyeContactTimer.current = null;
            }
            
            // Encouragement
            const encouragement = ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)];
            console.log('   🎉 Encouragement:', encouragement);
            speakNow(encouragement, 'encouragement');
        }

        // Update last value
        lastEyeContactValue.current = hasEyeContact;
        
    }, [hasEyeContact, voiceRemindersEnabled, mode]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (noEyeContactTimer.current) {
                clearTimeout(noEyeContactTimer.current);
            }
        };
    }, []);

    // EDUCATIONAL CONTENT
    const generateAIContent = async (topic) => {
        if (!openaiRef.current) throw new Error('OpenAI not initialized');

        const response = await openaiRef.current.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: `Friendly teacher. 2 sentences max about ${topic}.` },
                { role: "user", content: `Tell me about ${topic}` }
            ],
            max_tokens: 80,
            temperature: 0.8
        });

        return response.choices[0].message.content;
    };

    const generateContent = async (topic) => {
        if (isGenerating) return;
        setIsGenerating(true);
        
        try {
            let content;
            
            if (useAI) {
                try {
                    content = await generateAIContent(topic);
                } catch (error) {
                    console.error('AI error:', error.message);
                    content = fallbackContent.education[topic];
                }
            } else {
                content = fallbackContent.education[topic];
            }
            
            setCurrentContent(content);
            setConversationHistory(prev => [...prev, { content, topic, timestamp: Date.now() }]);
            
            if (speechEnabled) {
                speakNow(content, 'educational');
            }
            
        } finally {
            setIsGenerating(false);
        }
    };

    // Milestones
    useEffect(() => {
        if (mode === 'prt' && eyeContactScore > 0) {
            const milestone = Math.floor(eyeContactScore / 50);
            
            if (milestone > lastScoreMilestone.current) {
                lastScoreMilestone.current = milestone;
                const topics = ['animals', 'space', 'colors', 'numbers'];
                const topic = topics[Math.floor(Math.random() * topics.length)];
                console.log(`🎯 Milestone ${milestone * 50}!`);
                generateContent(topic);
            }
        }
    }, [eyeContactScore, mode]);

    // Test
    const testVoice = () => {
        speakNow('Test voice working!', 'test');
    };

    const testAttentionPrompt = () => {
        const prompt = ATTENTION_PROMPTS[0];
        console.log('🧪 Manual attention test:', prompt);
        speakNow(prompt, 'attention');
    };

    // RENDER
    return (
        <div className="education-engine">
            {/* Test Buttons */}
            <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button 
                    onClick={testVoice}
                    style={{ 
                        background: '#2196f3', 
                        color: 'white', 
                        padding: '10px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    🧪 Test Voice
                </button>
                <button 
                    onClick={testAttentionPrompt}
                    style={{ 
                        background: '#ff5722', 
                        color: 'white', 
                        padding: '10px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    🔔 Test Prompt
                </button>
            </div>

            {/* Status */}
            <div className="ai-status">
                {useAI ? <span className="status-badge ai-active">🤖 AI</span> : <span className="status-badge fallback-active">📝 Fallback</span>}
                {(mode === 'prompting' || mode === 'prt') && (
                    <span className="status-badge voice-status">
                        {voiceRemindersEnabled ? '🔊 ON' : '🔇 OFF'}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="content-display">
                <p className="content">
                    {isGenerating ? 'Thinking...' : (currentContent || 'Click a button')}
                </p>
            </div>
            
            {/* Buttons */}
            <div className="controls">
                <button onClick={() => generateContent('animals')} disabled={isGenerating}>🐘 Animals</button>
                <button onClick={() => generateContent('space')} disabled={isGenerating}>🚀 Space</button>
                <button onClick={() => generateContent('colors')} disabled={isGenerating}>🎨 Colors</button>
                <button onClick={() => generateContent('numbers')} disabled={isGenerating}>🔢 Numbers</button>
            </div>

            {/* Speech Toggle */}
            <div className="speech-toggle">
                <label>
                    <input 
                        type="checkbox"
                        checked={speechEnabled}
                        onChange={(e) => setSpeechEnabled(e.target.checked)}
                    />
                    <span>🔊 Educational Speech</span>
                </label>
            </div>

            {/* PRT Stats */}
            {mode === 'prt' && (
                <div className="engagement-feedback">
                    <p>Score: {eyeContactScore}</p>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(eyeContactScore, 100)}%` }} />
                    </div>
                    <p className="milestone-info">Next: {(Math.floor(eyeContactScore / 50) + 1) * 50}</p>
                </div>
            )}

            {/* History */}
            {conversationHistory.length > 0 && (
                <div className="conversation-history">
                    <h4>Recent:</h4>
                    <ul>
                        {conversationHistory.slice(-3).map((item, idx) => (
                            <li key={idx}>{item.topic}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* DEBUG */}
            <div className="debug-info" style={{
                background: hasEyeContact ? '#e8f5e9' : '#ffebee',
                border: `2px solid ${hasEyeContact ? '#4caf50' : '#f44336'}`,
                padding: '12px',
                borderRadius: '8px',
                marginTop: '12px'
            }}>
                <h4 style={{ margin: '0 0 8px 0', color: hasEyeContact ? '#2e7d32' : '#c62828' }}>
                    {hasEyeContact ? '✅ EYE CONTACT' : '❌ NO EYE CONTACT'}
                </h4>
                <p><strong>Face:</strong> {faceDetected ? '✅' : '❌'}</p>
                <p><strong>Timer Active:</strong> {noEyeContactTimer.current ? '⏱️ YES (counting to 4s)' : '❌ NO'}</p>
                <p><strong>Voice Reminders:</strong> {voiceRemindersEnabled ? '✅ ON' : '❌ OFF'}</p>
                <p style={{ fontSize: '12px', marginTop: '8px', padding: '6px', background: hasEyeContact ? '#fff' : '#fff9c4', borderRadius: '4px' }}>
                    {hasEyeContact ? 
                        '👀 Keep looking away for 4 seconds to hear prompt' : 
                        '⏱️ Stay looking away... counting to 4 seconds...'}
                </p>
            </div>
        </div>
    );
}
