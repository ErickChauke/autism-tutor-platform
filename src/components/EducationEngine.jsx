import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import { lipSyncController } from '../utils/lip-sync-controller';
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
    const [useAI, setUseAI] = useState(false);
    const [speechEnabled, setSpeechEnabled] = useState(true);
    
    const [activeSnippetTopic, setActiveSnippetTopic] = useState(null);
    const [snippetIndex, setSnippetIndex] = useState(0);
    const [snippetWasInterrupted, setSnippetWasInterrupted] = useState(false);
    
    const activeSnippetTopicRef = useRef(null);
    const snippetIndexRef = useRef(0);
    const snippetWasInterruptedRef = useRef(false);
    
    const snippetTimer = useRef(null);
    const speechSynthRef = useRef(window.speechSynthesis);
    
    const openaiRef = useRef(null);
    
    const lastPromptTime = useRef(0);
    const usedPrompts = useRef([]);
    const lastEyeContactValue = useRef(hasEyeContact);
    
    const eyeContactLostTime = useRef(null);
    const debounceTimer = useRef(null);
    
    const currentSpeechType = useRef(null);
    const isSpeaking = useRef(false);

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

    const handleSpeechEnd = (type) => {
        log('⏹️', `SPEECH ENDED: [${type}]`, 1);
        
        currentSpeechType.current = null;
        isSpeaking.current = false;
        
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
        log('🔊', `SPEAK: [${type}] "${preview}"`, 0);
        
        if (!text) return;
        
        currentSpeechType.current = type;
        isSpeaking.current = true;
        
        lipSyncController.stop();
        speechSynthRef.current.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices.find(v => 
            v.name.includes("Zira") || 
            v.name.includes("Female")
        ) || voices[0];
        
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        
        // Start lip sync
        lipSyncController.start(utterance, () => {
            handleSpeechEnd(type);
        });
        
        speechSynthRef.current.speak(utterance);
    };

    const handleSnippetEnd = () => {
        log('📚', `handleSnippetEnd() - index=${snippetIndexRef.current}`, 1);
        
        if (!activeSnippetTopicRef.current) return;
        
        const snippets = educationalSnippets[activeSnippetTopicRef.current];
        
        if (!snippetWasInterruptedRef.current) {
            log('✅', `Snippet ${snippetIndexRef.current + 1} completed`, 2);
            
            if (snippetIndexRef.current < snippets.length - 1) {
                const nextIndex = snippetIndexRef.current + 1;
                log('⏭️', `Advancing to snippet ${nextIndex + 1}`, 2);
                
                snippetTimer.current = setTimeout(() => {
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
        log('🎉', `handleEncouragementEnd()`, 1);
        
        if (!activeSnippetTopicRef.current) return;
        
        if (snippetWasInterruptedRef.current) {
            log('🔄', `Replaying snippet ${snippetIndexRef.current + 1}`, 2);
            
            setTimeout(() => {
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
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }

            if (!hasEyeContact) {
                eyeContactLostTime.current = now;
                
                debounceTimer.current = setTimeout(() => {
                    if (activeSnippetTopicRef.current) {
                        snippetWasInterruptedRef.current = true;
                        setSnippetWasInterrupted(true);
                    }
                    
                    const promptNow = Date.now();
                    
                    if (promptNow - lastPromptTime.current < 10000) {
                        return;
                    }
                    
                    if (usedPrompts.current.length >= ATTENTION_PROMPTS.length) {
                        usedPrompts.current = [];
                    }
                    const available = ATTENTION_PROMPTS.filter(p => !usedPrompts.current.includes(p));
                    const prompt = available[Math.floor(Math.random() * available.length)];
                    usedPrompts.current.push(prompt);
                    
                    speakNow(prompt, 'attention');
                    lastPromptTime.current = promptNow;
                }, EYE_CONTACT_DEBOUNCE);
            } else {
                const timeAway = eyeContactLostTime.current 
                    ? (now - eyeContactLostTime.current) 
                    : 0;
                
                if (timeAway >= EYE_CONTACT_DEBOUNCE) {
                    const encouragement = ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)];
                    speakNow(encouragement, 'encouragement');
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

    return (
        <div className="education-engine">
            <div className="ai-status">
                {useAI ? <span className="status-badge ai-active">🤖 AI</span> : <span className="status-badge fallback-active">📝 Fallback</span>}
                {activeSnippetTopic && (
                    <span className="status-badge" style={{ background: '#9c27b0', color: 'white', marginLeft: '8px' }}>
                        📚 {activeSnippetTopic.toUpperCase()} {snippetIndex + 1} / {educationalSnippets[activeSnippetTopic].length}
                        {snippetWasInterrupted && ' 🔄'}
                    </span>
                )}
            </div>

            <div className="content-display">
                <p className="content">
                    {currentContent || 'Click Animals, Space, Colors, or Numbers'}
                </p>
            </div>
            
            <div className="controls">
                <button onClick={() => generateContent('animals')} disabled={activeSnippetTopic}>🐘 Animals</button>
                <button onClick={() => generateContent('space')} disabled={activeSnippetTopic}>🚀 Space</button>
                <button onClick={() => generateContent('colors')} disabled={activeSnippetTopic}>🎨 Colors</button>
                <button onClick={() => generateContent('numbers')} disabled={activeSnippetTopic}>🔢 Numbers</button>
            </div>

            {activeSnippetTopic && (
                <div style={{ 
                    background: '#e3f2fd', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    marginTop: '12px',
                    border: '2px solid #2196f3'
                }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>
                        📚 {activeSnippetTopic.charAt(0).toUpperCase() + activeSnippetTopic.slice(1)} - Progress
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
        </div>
    );
}
