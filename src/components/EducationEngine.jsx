import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import { lipSyncController } from '../utils/lip-sync-controller';
import '../styles/EducationEngine.css';

const ATTENTION_PROMPTS = [
    "Hey, can you please look at me!",
    "Can you look at my eyes please?",
    "Hey I am over here!",
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
        "Elephants are very smart animals that live in family groups and can remember things for many years.",
        "They use their long trunks like hands to pick up food, drink water, and greet each other affectionately.",
        "Baby elephants are called calves and they stay very close to their mothers for several years while learning.",
        "Elephants love to play in water and mud to cool down and protect their skin from the sun.",
        "They communicate with each other using low rumbling sounds that humans sometimes cannot even hear at all."
    ],
    space: [
        "Space is the vast area beyond Earth's atmosphere where planets, stars, and galaxies exist in the universe around us.",
        "The sun is our closest star and it provides light and warmth to all living things here on Earth.",
        "There are billions of galaxies in space, each containing millions or even billions of stars spread throughout the universe.",
        "Astronauts float in space because there is no gravity pulling them down like it does here on Earth.",
        "The moon orbits around our planet Earth and we can see it shining brightly in the night sky above."
    ],
    colors: [
        "Red, blue, and yellow are called primary colors because you cannot make them by mixing other colors together at all.",
        "You can mix primary colors together to create new colors like purple, green, and orange which are called secondary colors.",
        "When you mix red and blue paint together carefully, you will create a beautiful purple color for your artwork.",
        "Blue and yellow mixed together will make green, which is the color of grass, trees, and many leaves outside.",
        "Colors can make us feel different emotions like red for excitement, blue for calmness, and yellow for happiness and joy."
    ],
    numbers: [
        "Numbers are special symbols that help us count things like toys, apples, books, and many other objects around us.",
        "One, two, three, four, five are the first five counting numbers that we learn when we are very young.",
        "We use numbers every single day to tell time, count money, measure things, and even play fun games together.",
        "Numbers can be added together to make bigger numbers, like two plus three equals five in total when counted.",
        "Ten is a special number with two digits, one and zero, and it helps us count to higher numbers easily."
    ],
    shapes: [
        "Circles are round shapes with no corners or edges, like wheels, balls, and plates we use every day.",
        "Squares have four equal sides and four corners, and we see them in windows, boxes, and building blocks.",
        "Triangles have three sides and three corners, and they are very strong shapes used in bridges and buildings.",
        "Rectangles are like stretched squares with two long sides and two short sides, like doors and books we read.",
        "Stars have pointed tips radiating outward and we see them twinkling beautifully in the dark night sky above."
    ],
    weather: [
        "The sun shines brightly in the sky giving us light and warmth during the daytime hours each day.",
        "Rain falls from clouds in the sky and helps plants grow while filling rivers, lakes, and oceans with water.",
        "Snow forms when water freezes in cold clouds and falls as white fluffy flakes covering the ground beautifully.",
        "Wind is moving air that we cannot see but we can feel it blowing and hear it whistling outside.",
        "Clouds float high in the sky and they can be white and fluffy or dark and gray before storms arrive."
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
    voiceRemindersEnabled = true,
    sessionLength = 'standard'
}) {
    const [currentContent, setCurrentContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [useAI, setUseAI] = useState(false);
    const [completedTopics, setCompletedTopics] = useState([]);
    
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

    // Session length configurations
    const sessionConfig = {
        quick: { maxTopics: 2, label: 'Quick Session (2 topics)' },
        standard: { maxTopics: 4, label: 'Standard Session (4 topics)' },
        extended: { maxTopics: 6, label: 'Extended Session (6 topics)' }
    };

    const config = sessionConfig[sessionLength] || sessionConfig.standard;
    const availableTopics = Object.keys(educationalSnippets);
    const canSelectMore = completedTopics.length < config.maxTopics;

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
                
                // Mark topic as completed
                setCompletedTopics(prev => [...prev, activeSnippetTopicRef.current]);
                
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
        if (isGenerating || !canSelectMore || completedTopics.includes(topic)) return;
        log('🎯', `Button clicked: ${topic}`, 0);
        startSnippetContent(topic);
    };

    const topicEmojis = {
        animals: '🐘',
        space: '🚀',
        colors: '🎨',
        numbers: '🔢',
        shapes: '🔷',
        weather: '☁️'
    };

    return (
        <div className="education-engine">
            <div className="ai-status">
                {useAI ? <span className="status-badge ai-active">🤖 AI</span> : <span className="status-badge fallback-active">📝 Fallback</span>}
                <span className="status-badge" style={{ background: '#673ab7', color: 'white', marginLeft: '8px' }}>
                    {config.label}
                </span>
                <span className="status-badge" style={{ background: '#ff9800', color: 'white', marginLeft: '8px' }}>
                    {completedTopics.length} / {config.maxTopics} completed
                </span>
                {activeSnippetTopic && (
                    <span className="status-badge" style={{ background: '#9c27b0', color: 'white', marginLeft: '8px' }}>
                        📚 {activeSnippetTopic.toUpperCase()} {snippetIndex + 1} / {educationalSnippets[activeSnippetTopic].length}
                        {snippetWasInterrupted && ' 🔄'}
                    </span>
                )}
            </div>

            <div className="content-display">
                <p className="content">
                    {currentContent || `Choose ${config.maxTopics} topics for your ${sessionLength} session`}
                </p>
            </div>
            
            <div className="controls">
                {availableTopics.map(topic => (
                    <button 
                        key={topic}
                        onClick={() => generateContent(topic)} 
                        disabled={activeSnippetTopic || !canSelectMore || completedTopics.includes(topic)}
                        className={completedTopics.includes(topic) ? 'completed' : ''}
                    >
                        {topicEmojis[topic]} {topic.charAt(0).toUpperCase() + topic.slice(1)}
                        {completedTopics.includes(topic) && ' ✅'}
                    </button>
                ))}
            </div>

            {!canSelectMore && !activeSnippetTopic && (
                <div style={{ 
                    background: '#4caf50', 
                    color: 'white',
                    padding: '16px', 
                    borderRadius: '8px', 
                    marginTop: '12px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                }}>
                    🎉 Session Complete! You finished all {config.maxTopics} topics!
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
