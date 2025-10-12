/**
 * SpeechManager - Centralized speech coordination
 * Prevents multiple voices talking at once
 */

class SpeechManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.currentUtterance = null;
        this.queue = [];
        this.isSpeaking = false;
        this.voice = null;
        this.initVoice();
    }

    initVoice() {
        const loadVoices = () => {
            const voices = this.synth.getVoices();
            this.voice = voices.find(voice => 
                voice.name.includes('Google') || 
                voice.name.includes('Female') ||
                voice.name.includes('Samantha') ||
                voice.lang.startsWith('en')
            ) || voices[0];
            
            console.log('🔊 Voice loaded:', this.voice?.name || 'Default');
        };

        loadVoices();
        
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
    }

    speak(text, options = {}) {
        return new Promise((resolve) => {
            if (!this.synth || !text) {
                resolve();
                return;
            }

            // Cancel any ongoing speech
            this.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.voice;
            utterance.rate = options.rate || 0.9;
            utterance.pitch = options.pitch || 1.1;
            utterance.volume = options.volume || 0.9;

            utterance.onstart = () => {
                this.isSpeaking = true;
                console.log('🔊 Speaking:', text);
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                this.currentUtterance = null;
                console.log('✅ Finished speaking');
                resolve();
            };

            utterance.onerror = (error) => {
                console.error('❌ Speech error:', error);
                this.isSpeaking = false;
                this.currentUtterance = null;
                resolve();
            };

            this.currentUtterance = utterance;
            this.synth.speak(utterance);
        });
    }

    cancel() {
        if (this.synth) {
            this.synth.cancel();
            this.isSpeaking = false;
            this.currentUtterance = null;
        }
    }

    isBusy() {
        return this.isSpeaking || this.synth.speaking;
    }
}

// Singleton instance
export const speechManager = new SpeechManager();
