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
    ],
    ocean: [
        "The ocean is a huge body of salt water that covers most of our planet Earth's surface all around.",
        "Dolphins are smart ocean animals that swim in groups and communicate with clicks and whistles to each other.",
        "Coral reefs are beautiful underwater structures where thousands of colorful fish live together in communities every day.",
        "Whales are the largest animals on Earth and they can sing songs that travel for miles through the water.",
        "Starfish have five arms and can regrow a new arm if one breaks off, which is truly amazing to see."
    ],
    dinosaurs: [
        "Dinosaurs were giant reptiles that lived on Earth millions of years ago before humans ever existed at all.",
        "The Tyrannosaurus Rex was one of the biggest meat-eating dinosaurs with huge teeth and powerful jaws for hunting.",
        "Some dinosaurs were as tall as buildings while others were as small as chickens running around on land.",
        "Plant-eating dinosaurs had long necks to reach leaves high up in trees and ate plants all day long.",
        "All dinosaurs became extinct millions of years ago, but scientists study their fossils to learn about them today."
    ],
    planets: [
        "Our solar system has eight planets that orbit around the sun in space in a specific order.",
        "Earth is the third planet from the sun and the only one we know of with life on it.",
        "Jupiter is the largest planet in our solar system and has a giant red spot that is actually a storm.",
        "Saturn has beautiful rings made of ice and rock that circle around it in space constantly moving around.",
        "Mars is called the red planet because its soil contains iron that makes it look reddish from far away."
    ],
    insects: [
        "Insects are small creatures with six legs and three body parts that live almost everywhere on our planet Earth.",
        "Bees are important insects that help flowers grow by spreading pollen and they make sweet honey in hives.",
        "Butterflies start as caterpillars and transform into beautiful flying insects with colorful wings through a special process called metamorphosis.",
        "Ants are very strong for their size and can carry objects many times heavier than their own body weight.",
        "Ladybugs are helpful insects that eat harmful bugs in gardens and they have spots on their red backs."
    ],
    food: [
        "Fruits are sweet foods that grow on trees and plants and they have seeds inside to make new plants.",
        "Vegetables come from different parts of plants like roots, stems, and leaves and are very healthy to eat.",
        "Bread is made from wheat flour, water, and yeast which makes it rise and become soft and fluffy.",
        "Milk comes from cows and contains calcium that helps build strong bones and teeth in our bodies.",
        "Pizza is a popular food with cheese and toppings on dough and people all around the world enjoy eating it."
    ],
    transportation: [
        "Cars are vehicles with four wheels that drive on roads and take people from one place to another quickly.",
        "Airplanes fly high in the sky and can travel very long distances across countries and oceans in hours.",
        "Trains run on tracks and can carry many passengers or cargo from city to city every single day.",
        "Boats and ships float on water and are used to travel across rivers, lakes, and the vast ocean.",
        "Bicycles have two wheels and pedals that people push with their feet to move forward on paths and roads."
    ],
    body: [
        "The human body has many different parts that all work together to help us live and move around.",
        "Our heart is a special muscle that pumps blood throughout our body every second of every single day.",
        "The brain is like a computer inside our head that controls everything we think, feel, and do constantly.",
        "Our bones form a skeleton that gives our body shape and protects our important organs inside us.",
        "We use our five senses to see, hear, smell, taste, and touch things in the world all around us."
    ],
    seasons: [
        "There are four seasons in a year: spring, summer, fall, and winter, and each one is different and special.",
        "Spring is when flowers bloom, trees grow new leaves, and baby animals are born after the cold winter ends.",
        "Summer is the warmest season with long sunny days perfect for swimming, playing outside, and having fun adventures.",
        "Fall is when leaves change to beautiful colors like red, orange, and yellow before falling off the trees.",
        "Winter is the coldest season when it might snow and we wear warm coats, hats, and gloves outside."
    ],
    music: [
        "Music is made of different sounds and notes that come together to create songs we can listen to.",
        "A piano has black and white keys that make different musical notes when you press them down gently.",
        "Drums are percussion instruments that you hit with sticks or hands to make rhythmic beats and sounds.",
        "Singing is using your voice to make musical sounds and many people love to sing their favorite songs.",
        "Different instruments like guitars, violins, and flutes can be played together in a band or orchestra beautifully."
    ],
    feelings: [
        "Feelings are emotions inside us like happiness, sadness, anger, and fear that everyone experiences in life every day.",
        "When we are happy we might smile, laugh, and feel light and excited about things around us constantly.",
        "Feeling sad is okay and normal, and it helps to talk to someone we trust when we feel this way.",
        "Being scared or afraid is our body's way of protecting us from danger or things that seem scary.",
        "We can feel proud when we work hard and accomplish something difficult that we have been trying to do."
    ],
    sports: [
        "Sports are physical activities and games that people play for fun, exercise, and sometimes in competitions with others.",
        "Soccer is a popular sport where players kick a ball and try to score goals without using their hands.",
        "Basketball is played with a round ball that players dribble and shoot through a high hoop to score points.",
        "Swimming is a great exercise where people move through water using their arms and legs in different strokes.",
        "Running races test how fast people can move their legs and many athletes train hard to run faster."
    ],
    plants: [
        "Plants are living things that grow from seeds and need water, sunlight, and soil to survive and thrive.",
        "Trees are the largest plants and they provide oxygen, shade, and homes for many birds and animals in nature.",
        "Flowers bloom in many beautiful colors and shapes and they attract bees and butterflies with their sweet smell.",
        "Vegetables like carrots and tomatoes are plants we grow in gardens that we can eat for healthy meals.",
        "Some plants like cacti can live in hot, dry deserts because they store water inside their thick stems."
    ],
    tools: [
        "Tools are objects that help people build things, fix things, and make work easier in many different ways.",
        "A hammer is used to hit nails into wood to hold pieces together when building furniture or houses.",
        "Scissors have two sharp blades that cut paper, cloth, and other materials when you squeeze the handles together.",
        "A screwdriver turns screws to fasten or unfasten parts and it comes in different sizes for different jobs.",
        "Measuring tape helps us measure how long, wide, or tall something is using inches or centimeters accurately."
    ],
    family: [
        "Family is a group of people who love and care for each other and live together or stay close.",
        "Parents are adults who take care of children by feeding them, teaching them, and keeping them safe every day.",
        "Brothers and sisters are siblings who share the same parents and often play together and help each other.",
        "Grandparents are our parents' parents and they often tell great stories and give warm hugs to their grandchildren.",
        "Families can look different with different numbers of people, but they all share love and support for one another."
    ]
};

const topicEmojis = {
    animals: '🐘',
    space: '🚀',
    colors: '🎨',
    numbers: '🔢',
    shapes: '🔷',
    weather: '☁️',
    ocean: '🌊',
    dinosaurs: '🦕',
    planets: '🪐',
    insects: '🐝',
    food: '🍕',
    transportation: '🚗',
    body: '🫀',
    seasons: '🍂',
    music: '🎵',
    feelings: '😊',
    sports: '⚽',
    plants: '🌱',
    tools: '🔨',
    family: '👨‍👩‍👧‍👦'
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

function getRandomTopics(count) {
    const allTopics = Object.keys(educationalSnippets);
    const shuffled = [...allTopics].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

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
    const [sessionTopics, setSessionTopics] = useState([]);
    
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

    const sessionConfig = {
        quick: { maxTopics: 2, label: 'Quick' },
        standard: { maxTopics: 4, label: 'Standard' },
        extended: { maxTopics: 6, label: 'Extended' }
    };

    const config = sessionConfig[sessionLength] || sessionConfig.standard;
    const canSelectMore = completedTopics.length < config.maxTopics;

    useEffect(() => {
        const randomTopics = getRandomTopics(config.maxTopics);
        setSessionTopics(randomTopics);
        log('🎲', `Random topics selected: ${randomTopics.join(', ')}`, 0);
    }, [config.maxTopics]);

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

    return (
        <div className="education-engine">
            <div className="ai-status">
                <span className="status-badge" style={{ background: '#673ab7', color: 'white' }}>
                    {config.label}
                </span>
                <span className="status-badge" style={{ background: '#ff9800', color: 'white', marginLeft: '8px' }}>
                    {completedTopics.length} / {config.maxTopics}
                </span>
                {activeSnippetTopic && (
                    <span className="status-badge" style={{ background: '#9c27b0', color: 'white', marginLeft: '8px' }}>
                        {activeSnippetTopic.toUpperCase()} {snippetIndex + 1}/{educationalSnippets[activeSnippetTopic].length}
                        {snippetWasInterrupted && ' 🔄'}
                    </span>
                )}
            </div>
            
            <div className="controls">
                {sessionTopics.map(topic => (
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
                    🎉 Session Complete!
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
                        {activeSnippetTopic.charAt(0).toUpperCase() + activeSnippetTopic.slice(1)}
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
                            {snippet}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
