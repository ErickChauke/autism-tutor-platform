/**
 * ContentManager - Centralized content and prompts
 */

export const CONTENT = {
    attentionPrompts: [
        "Hey, look at me!",
        "Can you look at my eyes?",
        "I'm over here!",
        "Let's make eye contact!",
        "Look at me, please!",
    ],

    encouragement: [
        "Great! You're back!",
        "Perfect! Thank you!",
        "Awesome! Good job!",
    ],

    educationalSnippets: {
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
    }
};

export class ContentManager {
    static getRandomPrompt(usedPrompts = []) {
        const available = CONTENT.attentionPrompts.filter(
            p => !usedPrompts.includes(p)
        );
        
        if (available.length === 0) {
            return CONTENT.attentionPrompts[0];
        }
        
        return available[Math.floor(Math.random() * available.length)];
    }

    static getRandomEncouragement() {
        const arr = CONTENT.encouragement;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    static getSnippets(topic) {
        return CONTENT.educationalSnippets[topic] || null;
    }

    static getAvailableTopics() {
        return Object.keys(CONTENT.educationalSnippets);
    }

    static addTopic(topicName, snippets) {
        if (!Array.isArray(snippets)) {
            console.error('❌ Snippets must be an array');
            return false;
        }
        
        CONTENT.educationalSnippets[topicName] = snippets;
        console.log(`✅ Added topic: ${topicName}`);
        return true;
    }
}
