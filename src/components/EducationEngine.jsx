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

const educationalSnippets = {
    animals: [
        "Elephants are very smart animals.",
        "They can remember things for many years.",
        "Baby elephants are called calves.",
        "Elephants use their trunks like hands.",
        "They love to play in water and mud."
    ],
    space: [
        "Space is the area beyond Earth's atmosphere.",
        "The sun is our closest star.",
        "There are billions of galaxies in space.",
        "Astronauts float because there's no gravity.",
        "The moon orbits around our planet Earth."
    ],
    colors: [
        "Red, blue, and yellow are primary colors.",
        "You can mix colors to make new ones.",
        "Red and blue make purple.",
        "Blue and yellow make green.",
        "Colors can make us feel different emotions."
    ],
    numbers: [
        "Numbers help us count things.",
        "One, two, three, four, five.",
        "We use numbers every single day.",
        "Numbers can be added together.",
        "Ten is a special number with two digits."
    ]
};

const TEST_CONTENT = {
    short: "This is a short educational message.",
    medium: "This is a medium length educational message that has been extended significantly.",
    long: "This is a very long educational message that has been specifically designed to test the interruption system."
};

const INTERRUPTION_CONFIG = {
    protectionWindow: 3000,
    maxEducationalLength: 10000,
    allowInterruptAfter: 5000
};

const EYE_CONTACT_DEBOUNCE = 1500;
const SNIPPET_ADVANCE_DELAY = 100;
const REPLAY_PAUSE_DURATION = 1000;

const log = (emoji, message, indent = 0) => {
    const prefix = '  '.repeat(indent);
    const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        fractionalSecondDigits: 3 
    });
    console.log(`[${timestamp}] ${prefix}${emoji} ${message}`);
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
    
    const [activeSnippetTopic, setActiveSnippetTopic] = useState(null);
    const [snippetIndex, setSnippetIndex] = useState(0);
    const [snippetWasInterrupted, setSnippetWasInterrupted] = useState(false);
    
    const activeSnippetTopicRef = useRef(null);
    const snippetIndexRef = useRef(0);
    const snippetWasInterruptedRef = useRef(false);
    
    const snippetTimer = useRef(null);
    
    const openaiRef = useRef(null);
    const speechSynthRef = useRef(window.speechSynthesis);
    const lastScoreMilestone = useRef(0);
    
    const lastPromptTime = useRef(0);
    const usedPrompts = useRef([]);
    const lastEyeContactValue = useRef(hasEyeContact);
    
    const eyeContactLostTime = useRef(null);
    const eyeContactGainedTime = useRef(null);
    const debounceTimer = useRef(null);
    
    const currentSpeechType = useRef(null);
    const isSpeaking = useRef(false);
    const speechStartTime = useRef(null);
    
    const sessionEventId = useRef(0);

    useEffect(() => {
        if (process.env.REACT_APP_OPENAI_KEY) {
            openaiRef.current = new OpenAI({
                apiKey: process.env.REACT_APP_OPENAI_KEY,
                dangerouslyAllowBrowser: true
            });
            setUseAI(true);
            log('✅', 'OpenAI initialized');
        } else {
            log('ℹ️', 'Using fallback content');
        }
    }, []);

    const canInterruptCurrentSpeech = (incomingType, checkTime = Date.now()) => {
        if (!currentSpeechType.current || !isSpeaking.current) {
            return true;
        }

        if (currentSpeechType.current !== 'educational') {
            return true;
        }

        const timeSinceSpeechStart = checkTime - (speechStartTime.current || 0);

        if (timeSinceSpeechStart < INTERRUPTION_CONFIG.protectionWindow) {
            return false;
        }

        if (timeSinceSpeechStart > INTERRUPTION_CONFIG.maxEducationalLength) {
            return true;
        }

        if (incomingType === 'attention' && timeSinceSpeechStart > INTERRUPTION_CONFIG.allowInterruptAfter) {
            return true;
        }

        return false;
    };

    const handleSpeechEnd = (type) => {
        log('⏹️', `SPEECH ENDED: [${type}]`, 1);
        
        currentSpeechType.current = null;
        isSpeaking.current = false;
        speechStartTime.current = null;
        
        if (type === 'educational' && activeSnippetTopicRef.current) {
            log('📚', `Educational ended - calling handleSnippetEnd()`, 2);
            handleSnippetEnd();
        }
        
        if (type === 'encouragement' && activeSnippetTopicRef.current) {
            log('🎉', `Encouragement ended - calling handleEncouragementEnd()`, 2);
            handleEncouragementEnd();
        }
    };

    const speakNow = (text, type = 'normal') => {
        const preview = text.substring(0, 40) + (text.length > 40 ? '...' : '');
        log('🔊', `SPEAK REQUEST: [${type}] "${preview}"`, 0);
        
        if (!text) return;
        
        if (!canInterruptCurrentSpeech(type)) {
            log('🚫', `Interruption denied`, 1);
            return;
        }
        
        log('✅', `Interruption approved`, 1);
        
        if (currentSpeechType.current === 'educational' && (type === 'attention' || type === 'encouragement')) {
            log('🔄', `Marking interrupted`, 2);
            snippetWasInterruptedRef.current = true;
            setSnippetWasInterrupted(true);
        }
        
        speechSynthRef.current.cancel();
        lipSyncController.stop();
        speechTimingEstimator.stop();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
            log('▶️', `Speech started: [${type}]`, 1);
            currentSpeechType.current = type;
            isSpeaking.current = true;
            speechStartTime.current = Date.now();
        };
        
        speechTimingEstimator.start(text, 0.9);
        
        lipSyncController.start(utterance, () => {
            log('📞', `Lip sync callback: [${type}]`, 1);
            handleSpeechEnd(type);
        });
        
        speechSynthRef.current.speak(utterance);
    };

    const handleSnippetEnd = () => {
        log('📚', `handleSnippetEnd() - index=${snippetIndexRef.current}, interrupted=${snippetWasInterruptedRef.current}`, 1);
        
        if (!activeSnippetTopicRef.current) return;
        
        const snippets = educationalSnippets[activeSnippetTopicRef.current];
        
        if (!snippetWasInterruptedRef.current) {
            log('✅', `Snippet ${snippetIndexRef.current + 1} completed`, 2);
            
            if (snippetIndexRef.current < snippets.length - 1) {
                const nextIndex = snippetIndexRef.current + 1;
                log('⏭️', `Advancing to snippet ${nextIndex + 1} in ${SNIPPET_ADVANCE_DELAY}ms`, 2);
                
                snippetTimer.current = setTimeout(() => {
                    log('🚀', `Starting snippet ${nextIndex + 1}`, 2);
                    snippetIndexRef.current = nextIndex;
                    setSnippetIndex(nextIndex);
                    
                    speakNow(snippets[nextIndex], 'educational');
                }, SNIPPET_ADVANCE_DELAY);
            } else {
                log('🎉', `ALL COMPLETE for ${activeSnippetTopicRef.current}!`, 2);
                activeSnippetTopicRef.current = null;
                snippetIndexRef.current = 0;
                
                setActiveSnippetTopic(null);
                setSnippetIndex(0);
            }
        } else {
            log('⏸️', `Snippet ${snippetIndexRef.current + 1} was interrupted`, 2);
        }
    };

    const handleEncouragementEnd = () => {
        log('🎉', `handleEncouragementEnd() - interrupted=${snippetWasInterruptedRef.current}`, 1);
        
        if (!activeSnippetTopicRef.current) return;
        
        if (snippetWasInterruptedRef.current) {
            log('🔄', `Replaying snippet ${snippetIndexRef.current + 1} after ${REPLAY_PAUSE_DURATION}ms`, 2);
            
            setTimeout(() => {
                log('📚', `REPLAY: Starting snippet ${snippetIndexRef.current + 1}`, 2);
                
                snippetWasInterruptedRef.current = false;
                setSnippetWasInterrupted(false);
                
                const snippets = educationalSnippets[activeSnippetTopicRef.current];
                speakNow(snippets[snippetIndexRef.current], 'educational');
            }, REPLAY_PAUSE_DURATION);
        }
    };

    const startSnippetContent = (topic) => {
        log('📚', `startSnippetContent() - topic=${topic}`, 0);
        
        const snippets = educationalSnippets[topic];
        if (!snippets) return;
        
        activeSnippetTopicRef.current = topic;
        snippetIndexRef.current = 0;
        snippetWasInterruptedRef.current = false;
        
        setActiveSnippetTopic(topic);
        setSnippetIndex(0);
        setSnippetWasInterrupted(false);
        
        if (snippetTimer.current) {
            clearTimeout(snippetTimer.current);
        }
        
        log('▶️', `Playing snippet 1 of ${snippets.length}`, 1);
        speakNow(snippets[0], 'educational');
    };

    useEffect(() => {
        if (!voiceRemindersEnabled || mode === 'assessment' || mode === 'research') {
            return;
        }

        const now = Date.now();

        if (hasEyeContact !== lastEyeContactValue.current) {
            const eventId = ++sessionEventId.current;
            
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }

            if (!hasEyeContact) {
                eyeContactLostTime.current = now;
                log('👁️', `[Event ${eventId}] EYE CONTACT LOST - Starting ${EYE_CONTACT_DEBOUNCE/1000}s debounce`);
                
                debounceTimer.current = setTimeout(() => {
                    const timeLost = Date.now() - eyeContactLostTime.current;
                    
                    if (timeLost >= EYE_CONTACT_DEBOUNCE) {
                        log('🔴', `[Event ${eventId}] LOSS CONFIRMED after ${(timeLost/1000).toFixed(1)}s`, 1);
                        
                        if (activeSnippetTopicRef.current && !snippetWasInterruptedRef.current) {
                            log('🔄', `Active topic - marking interrupted`, 2);
                            
                            if (snippetTimer.current) {
                                log('🚫', `Cancelling pending advance`, 3);
                                clearTimeout(snippetTimer.current);
                                snippetTimer.current = null;
                            }
                            
                            snippetWasInterruptedRef.current = true;
                            setSnippetWasInterrupted(true);
                        }
                        
                        const promptNow = Date.now();
                        
                        if (promptNow - lastPromptTime.current < 10000) {
                            log('🛑', `Cooldown active`, 2);
                            return;
                        }
                        
                        if (usedPrompts.current.length >= ATTENTION_PROMPTS.length) {
                            usedPrompts.current = [];
                        }
                        const available = ATTENTION_PROMPTS.filter(p => !usedPrompts.current.includes(p));
                        const prompt = available[Math.floor(Math.random() * available.length)];
                        usedPrompts.current.push(prompt);
                        
                        log('🔔', `ATTENTION: "${prompt}"`, 2);
                        speakNow(prompt, 'attention');
                        lastPromptTime.current = promptNow;
                    } else {
                        log('⚡', `[Event ${eventId}] QUICK RETURN (${(timeLost/1000).toFixed(1)}s < ${EYE_CONTACT_DEBOUNCE/1000}s) - No encouragement`);
                    }
                }, EYE_CONTACT_DEBOUNCE);
            } else {
                eyeContactGainedTime.current = now;
                
                const timeAway = eyeContactLostTime.current 
                    ? (now - eyeContactLostTime.current) 
                    : 0;
                
                const awaySeconds = (timeAway / 1000).toFixed(1);
                
                if (timeAway >= EYE_CONTACT_DEBOUNCE) {
                    log('🟢', `[Event ${eventId}] REGAINED after ${awaySeconds}s`);
                    
                    const encouragement = ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)];
                    log('🎉', `ENCOURAGEMENT: "${encouragement}"`, 1);
                    speakNow(encouragement, 'encouragement');
                } else {
                    log('⚡', `[Event ${eventId}] QUICK RETURN (${awaySeconds}s < ${EYE_CONTACT_DEBOUNCE/1000}s) - No encouragement`);
                }
                
                eyeContactLostTime.current = null;
            }
        }

        lastEyeContactValue.current = hasEyeContact;
        
    }, [hasEyeContact, voiceRemindersEnabled, mode]);

    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
            if (snippetTimer.current) {
                clearTimeout(snippetTimer.current);
            }
        };
    }, []);

    const generateContent = async (topic) => {
        if (isGenerating) return;
        log('🎯', `Button clicked: ${topic}`, 0);
        startSnippetContent(topic);
    };

    const testVoice = () => {
        log('🧪', 'TEST: Voice check');
        speakNow('Test voice working!', 'test');
    };

    const testAttentionPrompt = () => {
        const prompt = ATTENTION_PROMPTS[0];
        log('🧪', `TEST: Attention prompt`);
        speakNow(prompt, 'attention');
    };

    const testShortContent = () => {
        log('🧪', 'TEST: Short content');
        setCurrentContent(TEST_CONTENT.short);
        if (speechEnabled) {
            speakNow(TEST_CONTENT.short, 'educational');
        }
    };

    const testMediumContent = () => {
        log('🧪', 'TEST: Medium content');
        setCurrentContent(TEST_CONTENT.medium);
        if (speechEnabled) {
            speakNow(TEST_CONTENT.medium, 'educational');
        }
    };

    const testLongContent = () => {
        log('🧪', 'TEST: Long content');
        setCurrentContent(TEST_CONTENT.long);
        if (speechEnabled) {
            speakNow(TEST_CONTENT.long, 'educational');
        }
    };

    return (
        <div className="education-engine">
            <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button onClick={testVoice} style={{ background: '#2196f3', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    🧪 Test Voice
                </button>
                <button onClick={testAttentionPrompt} style={{ background: '#ff5722', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    🔔 Test Prompt
                </button>
            </div>

            <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button onClick={testShortContent} disabled={isGenerating} style={{ background: '#4caf50', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    📏 Short
                </button>
                <button onClick={testMediumContent} disabled={isGenerating} style={{ background: '#ff9800', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    📐 Medium
                </button>
                <button onClick={testLongContent} disabled={isGenerating} style={{ background: '#9c27b0', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    📏📏 Long
                </button>
            </div>

            <div className="ai-status">
                {useAI ? <span className="status-badge ai-active">🤖 AI</span> : <span className="status-badge fallback-active">📝 Fallback</span>}
                {(mode === 'prompting' || mode === 'prt') && (
                    <span className="status-badge voice-status">
                        {voiceRemindersEnabled ? '🔊 ON' : '🔇 OFF'}
                    </span>
                )}
                {activeSnippetTopic && (
                    <span className="status-badge" style={{ background: '#9c27b0', color: 'white', marginLeft: '8px' }}>
                        📚 {activeSnippetTopic.toUpperCase()} {snippetIndex + 1} / {educationalSnippets[activeSnippetTopic].length}
                        {snippetWasInterrupted && ' 🔄'}
                    </span>
                )}
            </div>

            <div className="content-display">
                <p className="content">
                    {isGenerating ? 'Thinking...' : (currentContent || 'Click Animals, Space, Colors, or Numbers')}
                </p>
            </div>
            
            <div className="controls">
                <button onClick={() => generateContent('animals')} disabled={isGenerating || activeSnippetTopic}>🐘 Animals</button>
                <button onClick={() => generateContent('space')} disabled={isGenerating || activeSnippetTopic}>🚀 Space</button>
                <button onClick={() => generateContent('colors')} disabled={isGenerating || activeSnippetTopic}>🎨 Colors</button>
                <button onClick={() => generateContent('numbers')} disabled={isGenerating || activeSnippetTopic}>🔢 Numbers</button>
            </div>

            <div className="speech-toggle">
                <label>
                    <input type="checkbox" checked={speechEnabled} onChange={(e) => setSpeechEnabled(e.target.checked)} />
                    <span>🔊 Educational Speech</span>
                </label>
            </div>

            {mode === 'prt' && (
                <div className="engagement-feedback">
                    <p>Score: {eyeContactScore}</p>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(eyeContactScore, 100)}%` }} />
                    </div>
                </div>
            )}

            {activeSnippetTopic && (
                <div style={{ 
                    background: '#e3f2fd', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    marginTop: '12px',
                    border: '2px solid #2196f3'
                }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>
                        📚 {activeSnippetTopic.charAt(0).toUpperCase() + activeSnippetTopic.slice(1)} - Snippet Progress
                    </h4>
                    {educationalSnippets[activeSnippetTopic].map((snippet, idx) => (
                        <div key={idx} style={{
                            padding: '6px',
                            marginBottom: '4px',
                            background: idx < snippetIndex ? '#c8e6c9' : idx === snippetIndex ? '#fff9c4' : '#f5f5f5',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            borderLeft: `3px solid ${idx < snippetIndex ? '#4caf50' : idx === snippetIndex ? '#ff9800' : '#ccc'}`
                        }}>
                            {idx < snippetIndex && '✅ '}
                            {idx === snippetIndex && (snippetWasInterrupted ? '🔄 ' : '▶️ ')}
                            {idx > snippetIndex && '⏭️ '}
                            <strong>Snippet {idx + 1}:</strong> {snippet}
                        </div>
                    ))}
                </div>
            )}

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
                <p><strong>Debounce:</strong> {debounceTimer.current ? '⏱️ YES' : '❌ NO'}</p>
                <p><strong>Voice:</strong> {voiceRemindersEnabled ? '✅ ON' : '❌ OFF'}</p>
                {activeSnippetTopic && (
                    <>
                        <p><strong>Topic:</strong> {activeSnippetTopic}</p>
                        <p><strong>Snippet:</strong> {snippetIndex + 1}/{educationalSnippets[activeSnippetTopic].length}</p>
                        <p><strong>Interrupted:</strong> {snippetWasInterrupted ? '🔄 YES' : '❌ NO'}</p>
                    </>
                )}
            </div>
        </div>
    );
}
