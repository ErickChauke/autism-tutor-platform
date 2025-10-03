import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import '../styles/EducationEngine.css';

const fallbackContent = {
    eyeContact: [
        "Great job looking at my eyes!",
        "You're doing amazing!",
        "I love when you look at me!"
    ],
    encouragement: [
        "Keep going, you're doing great!",
        "Excellent work!",
        "You're learning so fast!"
    ],
    education: {
        animals: "Let's learn about animals. Did you know elephants are very smart? They can remember things for many years!",
        space: "Space is amazing! Did you know the sun is a big ball of hot gas? It gives us light and warmth!",
        colors: "Colors are everywhere! Red, blue, and yellow are primary colors. We can mix them to make other colors!",
        numbers: "Let's count together! One, two, three, four, five! Numbers help us count things around us."
    }
};

export default function EducationEngine({ eyeContactScore = 0, mode = 'prompting' }) {
    const [currentContent, setCurrentContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [useAI, setUseAI] = useState(false);
    const speechSynthRef = useRef(window.speechSynthesis);
    const openaiRef = useRef(null);

    useEffect(() => {
        if (process.env.REACT_APP_OPENAI_KEY) {
            openaiRef.current = new OpenAI({
                apiKey: process.env.REACT_APP_OPENAI_KEY,
                dangerouslyAllowBrowser: true
            });
            setUseAI(true);
            console.log('OpenAI API initialized');
        } else {
            console.log('No API key found, using fallback content');
            setUseAI(false);
        }
    }, []);

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
        setIsGenerating(true);
        
        try {
            let content;
            
            if (useAI) {
                try {
                    content = await generateAIContent(topic);
                    console.log('AI content generated');
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
            
            speakContent(content);
            
        } catch (error) {
            console.error('Content generation error:', error);
            const fallback = "Let me think of something interesting to tell you!";
            setCurrentContent(fallback);
            speakContent(fallback);
        } finally {
            setIsGenerating(false);
        }
    };

    const getFallbackContent = (topic) => {
        if (fallbackContent.education[topic]) {
            return fallbackContent.education[topic];
        }
        
        if (eyeContactScore > 70) {
            return `Great eye contact! Let's learn about ${topic}. You're doing amazing!`;
        } else if (eyeContactScore > 40) {
            return `Good job looking at me! Here's something cool about ${topic}.`;
        } else {
            return `Look at my eyes and I'll tell you about ${topic}!`;
        }
    };

    const speakContent = (text) => {
        if (!speechSynthRef.current) return;
        
        speechSynthRef.current.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        utterance.pitch = 1.1;
        utterance.volume = 0.9;
        
        speechSynthRef.current.speak(utterance);
    };

    useEffect(() => {
        if (mode === 'prt' && eyeContactScore > 0) {
            if (eyeContactScore % 50 === 0 && eyeContactScore > 0) {
                const topics = ['animals', 'space', 'colors', 'numbers'];
                const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                generateContent(randomTopic);
            }
        }
    }, [eyeContactScore, mode]);

    return (
        <div className="education-engine">
            <div className="ai-status">
                {useAI ? (
                    <span className="status-badge ai-active">AI Active</span>
                ) : (
                    <span className="status-badge fallback-active">Fallback Content</span>
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
                <button onClick={() => generateContent('animals')}>
                    Animals
                </button>
                <button onClick={() => generateContent('space')}>
                    Space
                </button>
                <button onClick={() => generateContent('colors')}>
                    Colors
                </button>
                <button onClick={() => generateContent('numbers')}>
                    Numbers
                </button>
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
                </div>
            )}

            {conversationHistory.length > 0 && (
                <div className="conversation-history">
                    <h4>Recent Topics:</h4>
                    <ul>
                        {conversationHistory.slice(-3).map((item, idx) => (
                            <li key={idx}>{item.topic}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
