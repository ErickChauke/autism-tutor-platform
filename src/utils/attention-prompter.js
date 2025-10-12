/**
 * AttentionPrompter - Gentle voice reminders when focus is lost
 * Now uses centralized SpeechManager
 */

import { speechManager } from './speech-manager';

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

export class AttentionPrompter {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.delayBeforePrompt = options.delayBeforePrompt || 4000; // 4 seconds
        this.timeBetweenPrompts = options.timeBetweenPrompts || 10000; // 10 seconds
        
        this.lastPromptTime = 0;
        this.lostFocusTime = null;
        this.promptTimer = null;
        this.usedPrompts = [];
        this.wasLookingAway = false;
        
        console.log('👁️ AttentionPrompter initialized');
    }

    getRandomPrompt() {
        if (this.usedPrompts.length >= ATTENTION_PROMPTS.length) {
            this.usedPrompts = [];
        }

        const available = ATTENTION_PROMPTS.filter(p => !this.usedPrompts.includes(p));
        const selected = available[Math.floor(Math.random() * available.length)];
        this.usedPrompts.push(selected);
        
        return selected;
    }

    getRandomEncouragement() {
        return ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)];
    }

    onFocusUpdate(hasEyeContact, faceDetected) {
        if (!this.enabled || !faceDetected) return;

        const now = Date.now();
        
        if (!hasEyeContact && !this.wasLookingAway) {
            // Just lost focus
            console.log('👁️ Focus lost, starting timer...');
            this.wasLookingAway = true;
            this.lostFocusTime = now;
            
            // Clear any existing timer
            if (this.promptTimer) {
                clearTimeout(this.promptTimer);
            }
            
            // Set new timer
            this.promptTimer = setTimeout(() => {
                this.promptForAttention();
            }, this.delayBeforePrompt);
            
        } else if (hasEyeContact && this.wasLookingAway) {
            // Just regained focus
            console.log('👁️ Focus regained!');
            
            // Clear timer
            if (this.promptTimer) {
                clearTimeout(this.promptTimer);
                this.promptTimer = null;
            }
            
            // Give encouragement if they were away long enough
            const timeAway = now - this.lostFocusTime;
            if (timeAway > this.delayBeforePrompt && !speechManager.isBusy()) {
                const encouragement = this.getRandomEncouragement();
                speechManager.speak(encouragement, {
                    rate: 1.0,
                    pitch: 1.2,
                    volume: 0.8
                });
            }
            
            this.wasLookingAway = false;
            this.lostFocusTime = null;
        }
    }

    promptForAttention() {
        if (!this.enabled) return;

        const now = Date.now();
        
        // Don't prompt too frequently
        if (now - this.lastPromptTime < this.timeBetweenPrompts) {
            console.log('⏭️ Skipping prompt (too soon)');
            return;
        }

        // Don't interrupt if already speaking
        if (speechManager.isBusy()) {
            console.log('⏭️ Skipping prompt (speech busy)');
            return;
        }

        const prompt = this.getRandomPrompt();
        console.log('🔔 Prompting:', prompt);
        
        speechManager.speak(prompt, {
            rate: 0.9,
            pitch: 1.2,
            volume: 0.9
        });
        
        this.lastPromptTime = now;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        console.log('👁️ AttentionPrompter', enabled ? 'enabled' : 'disabled');
        
        if (!enabled && this.promptTimer) {
            clearTimeout(this.promptTimer);
            this.promptTimer = null;
        }
    }

    destroy() {
        if (this.promptTimer) {
            clearTimeout(this.promptTimer);
        }
        console.log('👁️ AttentionPrompter destroyed');
    }
}
