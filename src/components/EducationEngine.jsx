import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import '../styles/EducationEngine.css';

const fallbackContent = {
    education: {
        animals: "Let's learn about animals. Did you know elephants are very smart? They can remember things for many years!",
        space: "Space is amazing! Did you know the sun is a big ball of hot gas? It gives us light and warmth!",
        colors: "Colors are everywhere! Red, blue, and yellow are primary colors. We can mix them to make other colors!",
        numbers: "Let's count together! One, two, three, four, five! Numbers help us count things around us."
    }
};

const ATTENTION_PROMPTS = [
    "Hey, look at me!",
    "Can you look at my eyes?",
    "I'm over here!",
    "Let's make eye contact!",
    "Look at me, please!",
    "Can you see me?",
    "I'm waiting for you to look!",
    "Your eyes here, please!",
    "Focus on my face!",
    "Let me see your eyes!"
];

const ENCOURAGEMENT = [
    "Great! You're back!",
    "Perfect! Thank you!",
    "Awesome! Good job!",
    "Yes! That's it!",
    "Well done!"
];

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
    const openaiRef = useRef(null);
    const lastScoreMilestone = useRef(0);
    
    // Attention prompt state
    const speechSynthRef = useRef(window.speechSynthesis);
    const lastPromptTime = useRef(0);
    const lostFocusTime = useRef(null);
    const promptTimer = useRef(null);
    const usedPrompts = useRef([]);
    const wasLookingAway = useRef(false);
    const lastEyeContact = useRef(hasEyeContact);

    useEffect(() => {
        if (process.env.REACT_APP_OPENAI_KEY) {
            openaiRef.current = new OpenAI({
                apiKey: process.env.REACT_APP_OPENAI_KEY,
                dangerouslyAllowBrowser: true
            });
            setUseAI(true);
            console.log('✅ OpenAI API initialized');
        } else {
            console.log('ℹ️ No API key, using fallback content');
            setUseAI(false);
        }
    }, []);

    // VOICE FUNCTIONS - These work!
    const speakText = (text, options = {}) => {
        if (!speechSynthRef.current) return;
        
        // Cancel any ongoing speech
        speechSynthRef.current.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 0.9;
        utterance.pitch = options.pitch || 1.1;
        utterance.volume = options.volume || 0.9;
        
        console.log('🔊 Speaking:', text);
        speechSynthRef.current.speak(utterance);
    };

    // ATTENTION PROMPT FUNCTIONS
    const getRandomPrompt = () => {
        if (usedPrompts.current.length >= ATTENTION_PROMPTS.length) {
            usedPrompts.current = [];
        }
        const available = ATTENTION_PROMPTS.filter(p => !usedPrompts.current.includes(p));
        const selected = available[Math.floor(Math.random() * available.length)];
        usedPrompts.current.push(selected);
        return selected;
    };

    const getRandomEncouragement = () => {
        return ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)];
    };

    const promptForAttention = () => {
        if (!voiceRemindersEnabled || mode === 'assessment' || mode === 'research') return;

        const now = Date.now();
        
        // Don't prompt too frequently (10 seconds minimum)
        if (now - lastPromptTime.current < 10000) {
            console.log('⏭️ Skipping prompt (too soon)');
            return;
        }

        const prompt = getRandomPrompt();
        console.log('🔔 ATTENTION PROMPT:', prompt);
        
        speakText(prompt, {
            rate: 0.9,
            pitch: 1.2,
            volume: 0.9
        });
        
        lastPromptTime.current = now;
    };

    // ATTENTION TRACKING - Runs continuously
    useEffect(() => {
        if (!faceDetected || mode === 'assessment' || mode === 'research') {
            // Clear timers if face not detected or wrong mode
            if (promptTimer.current) {
                clearTimeout(promptTimer.current);
                promptTimer.current = null;
            }
            return;
        }

        const now = Date.now();

        // User just lost eye contact
        if (!hasEyeContact && lastEyeContact.current) {
            console.log('👁️ Lost eye contact - starting 4s timer');
            wasLookingAway.current = true;
            lostFocusTime.current = now;
            
            // Clear any existing timer
            if (promptTimer.current) {
                clearTimeout(promptTimer.current);
            }
            
            // Set new timer for 4 seconds
            promptTimer.current = setTimeout(() => {
                console.log('⏰ 4 seconds passed - prompting now!');
                promptForAttention();
            }, 4000);
        }
        
        // User just regained eye contact
        else if (hasEyeContact && !lastEyeContact.current) {
            console.log('👁️ Regained eye contact!');
            
            // Clear the prompt timer
            if (promptTimer.current) {
                clearTimeout(promptTimer.current);
                promptTimer.current = null;
            }
            
            // Give encouragement if they were away long enough
            if (wasLookingAway.current && voiceRemindersEnabled) {
                const timeAway = now - lostFocusTime.current;
                if (timeAway > 4000) {
                    const encouragement = getRandomEncouragement();
                    console.log('🎉 ENCOURAGEMENT:', encouragement);
                    speakText(encouragement, {
                        rate: 1.0,
                        pitch: 1.2,
                        volume: 0.8
                    });
                }
            }
            
            wasLookingAway.current = false;
        }

        lastEyeContact.current = hasEyeContact;
    }, [hasEyeContact, faceDetected, voiceRemindersEnabled, mode]);

    // Clean up timers
    useEffect(() => {
        return () => {
            if (promptTimer.current) {
                clearTimeout(promptTimer.current);
            }
        };
    }, []);

    // EDUCATIONAL CONTENT FUNCTIONS
    const generateAIContent = async (topic) => {
        if (!openaiRef.current) {
            throw new Error('OpenAI not initialized');
        }

        const engagementLevel = eyeContactScore > 70 ? 'high' : eyeContactScore > 40 ? 'medium' : 'low';
        
        const systemPrompt = `You are a friendly teacher for children with autism. Keep responses:
- Very simple and short (2-3 sentences max)
- Enthusiastic and positive
- About ${topic}
- Appropriate for engagement level: ${engagementLevel}`;

        const response = await openaiRef.current.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Tell me something interesting about ${topic}` }
            ],
            max_tokens: 100,
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
                    console.log('🤖 AI content generated');
                } catch (error) {
                    console.error('AI error, using fallback:', error);
                    content = getFallbackContent(topic);
                }
            } else {
                content = getFallbackContent(topic);
            }
            
            setCurrentContent(content);
            
            setConversationHistory(prev => [...prev, {
                role: 'assistant',
                content: content,
                timestamp: Date.now(),
                topic: topic
            }]);
            
            // Speak the content if enabled
            if (speechEnabled) {
                speakText(content, {
                    rate: 0.85,
                    pitch: 1.1,
                    volume: 0.9
                });
            }
            
        } catch (error) {
            console.error('Content generation error:', error);
            const fallback = "Let me think of something interesting to tell you!";
            setCurrentContent(fallback);
            if (speechEnabled) {
                speakText(fallback);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const getFallbackContent = (topic) => {
        if (fallbackContent.education[topic]) {
            return fallbackContent.education[topic];
        }
        return `Let's learn about ${topic}!`;
    };

    // Automatic content at milestones
    useEffect(() => {
        if (mode === 'prt' && eyeContactScore > 0) {
            const currentMilestone = Math.floor(eyeContactScore / 50);
            
            if (currentMilestone > lastScoreMilestone.current) {
                lastScoreMilestone.current = currentMilestone;
                
                const topics = ['animals', 'space', 'colors', 'numbers'];
                const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                
                console.log(`🎯 Milestone ${currentMilestone * 50}! Topic: ${randomTopic}`);
                generateContent(randomTopic);
            }
        }
    }, [eyeContactScore, mode]);

    return (
        <div className="education-engine">
            <div className="ai-status">
                {useAI ? (
                    <span className="status-badge ai-active">🤖 AI Active</span>
                ) : (
                    <span className="status-badge fallback-active">📝 Fallback Content</span>
                )}
                {(mode === 'prompting' || mode === 'prt') && (
                    <span className="status-badge voice-status">
                        {voiceRemindersEnabled ? '🔊 Voice ON' : '🔇 Voice OFF'}
                    </span>
                )}
            </div>

            <div className="content-display">
                {isGenerating ? (
                    <p className="generating">Thinking...</p>
                ) : (
                    <p className="content">{currentContent || "Click a button to learn something new!"}</p>
                )}
            </div>
            
            <div className="controls">
                <button onClick={() => generateContent('animals')} disabled={isGenerating}>
                    🐘 Animals
                </button>
                <button onClick={() => generateContent('space')} disabled={isGenerating}>
                    🚀 Space
                </button>
                <button onClick={() => generateContent('colors')} disabled={isGenerating}>
                    🎨 Colors
                </button>
                <button onClick={() => generateContent('numbers')} disabled={isGenerating}>
                    🔢 Numbers
                </button>
            </div>

            <div className="speech-toggle">
                <label>
                    <input 
                        type="checkbox"
                        checked={speechEnabled}
                        onChange={(e) => setSpeechEnabled(e.target.checked)}
                    />
                    <span>🔊 Enable Educational Speech</span>
                </label>
            </div>

            {mode === 'prt' && (
                <div className="engagement-feedback">
                    <p>Engagement Score: {eyeContactScore}</p>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${Math.min(eyeContactScore, 100)}%` }}
                        />
                    </div>
                    <p className="milestone-info">Next reward at: {(Math.floor(eyeContactScore / 50) + 1) * 50} points</p>
                </div>
            )}

            {conversationHistory.length > 0 && (
                <div className="conversation-history">
                    <h4>Recent Topics:</h4>
                    <ul>
                        {conversationHistory.slice(-3).map((item, idx) => (
                            <li key={idx}>
                                {item.topic === 'animals' && '🐘'}
                                {item.topic === 'space' && '🚀'}
                                {item.topic === 'colors' && '🎨'}
                                {item.topic === 'numbers' && '🔢'}
                                {' '}{item.topic}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
