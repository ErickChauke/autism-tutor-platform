/**
 * SpeechManager - Complete production version
 */

class SpeechManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.currentUtterance = null;
        this.isSpeaking = false;
        this.voice = null;
        this.voicesLoaded = false;
        this.boundaryCallbacks = [];
        this.startCallbacks = [];
        this.endCallbacks = [];
        this.pauseCallbacks = [];
        this.resumeCallbacks = [];
        
        this.wordsBeforeBreath = 8;
        this.minimumBreathInterval = 3000;
        
        this.initVoice();
        console.log('🔊 SpeechManager initialized');
    }

    initVoice() {
        const loadVoices = () => {
            const voices = this.synth.getVoices();
            
            if (voices.length === 0) {
                console.log('⏳ Waiting for voices...');
                return;
            }
            
            this.voice = voices.find(voice => 
                voice.name.includes('Zira') ||
                voice.name.includes('Female') ||
                voice.name.includes('Google') ||
                voice.name.includes('Samantha')
            ) || voices.find(v => v.lang.startsWith("en")) || voices[0];
            
            this.voicesLoaded = true;
            console.log('🔊 Voice loaded:', this.voice?.name || 'Default');
        };

        loadVoices();
        
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
    }

    onBoundary(callback) {
        this.boundaryCallbacks.push(callback);
        return () => {
            this.boundaryCallbacks = this.boundaryCallbacks.filter(cb => cb !== callback);
        };
    }

    onStart(callback) {
        this.startCallbacks.push(callback);
        return () => {
            this.startCallbacks = this.startCallbacks.filter(cb => cb !== callback);
        };
    }

    onEnd(callback) {
        this.endCallbacks.push(callback);
        return () => {
            this.endCallbacks = this.endCallbacks.filter(cb => cb !== callback);
        };
    }

    onPause(callback) {
        this.pauseCallbacks.push(callback);
        return () => {
            this.pauseCallbacks = this.pauseCallbacks.filter(cb => cb !== callback);
        };
    }

    onResume(callback) {
        this.resumeCallbacks.push(callback);
        return () => {
            this.resumeCallbacks = this.resumeCallbacks.filter(cb => cb !== callback);
        };
    }

    getPhonemeInfo(word) {
        if (!word) return 'neutral';
        
        const w = word.toLowerCase();
        
        if (/^[aeiou]/.test(w) || w.includes('ah') || w.includes('aw')) {
            return 'open';
        }
        if (w.includes('ee') || w.includes('ea') || /^[e]/.test(w)) {
            return 'wide';
        }
        if (w.includes('oo') || w.includes('ou') || /^[o]/.test(w)) {
            return 'rounded';
        }
        if (/^[mbp]/.test(w)) {
            return 'closed';
        }
        
        return 'medium';
    }

    detectBreathPause(text, charIndex) {
        const char = text[charIndex];
        
        if (char === '.' || char === '!' || char === '?') {
            return 600;
        }
        if (char === ',' || char === ';') {
            return 300;
        }
        if (char === ':' || char === '—' || char === '-') {
            return 400;
        }
        
        return 0;
    }

    shouldInsertSmartBreath(wordIndex, timeSinceLastBreath) {
        const wordCountCondition = wordIndex > 0 && wordIndex % this.wordsBeforeBreath === 0;
        const timeCondition = timeSinceLastBreath > this.minimumBreathInterval;
        return wordCountCondition && timeCondition;
    }

    insertSmartBreath(reason = 'word count') {
        console.log('💨 Smart breath:', reason);
        
        const pauseDuration = 400;
        
        this.pauseCallbacks.forEach(cb => {
            try {
                cb({ duration: pauseDuration, type: 'smart', reason: reason });
            } catch (err) {}
        });
        
        setTimeout(() => {
            this.resumeCallbacks.forEach(cb => {
                try { cb(); } catch (err) {}
            });
        }, pauseDuration);
    }

    speak(text, options = {}) {
        return new Promise((resolve) => {
            if (!this.synth || !text) {
                resolve();
                return;
            }

            if (!this.voicesLoaded) {
                setTimeout(() => this.speak(text, options).then(resolve), 100);
                return;
            }

            this.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.voice;
            utterance.rate = options.rate || 0.95;
            utterance.pitch = options.pitch || 1.35;
            utterance.volume = options.volume || 0.9;
            utterance.lang = 'en-US';

            let currentWordIndex = 0;
            let lastBreathTime = Date.now();

            utterance.onstart = () => {
                this.isSpeaking = true;
                lastBreathTime = Date.now();
                console.log('🔊 Speaking:', text.substring(0, 40) + '...');
                
                this.startCallbacks.forEach(cb => {
                    try { cb(); } catch (err) {}
                });
            };

            utterance.onboundary = (event) => {
                if (event.name === 'word') {
                    const charIndex = event.charIndex;
                    const currentWord = text.substring(charIndex).split(/\s+/)[0];
                    const phonemeInfo = this.getPhonemeInfo(currentWord);
                    
                    console.log('👄 Word:', currentWord, '→', phonemeInfo);
                    
                    this.boundaryCallbacks.forEach(cb => {
                        try {
                            cb({
                                word: currentWord,
                                charIndex: charIndex,
                                phoneme: phonemeInfo,
                                wordIndex: currentWordIndex
                            });
                        } catch (err) {}
                    });
                    
                    currentWordIndex++;
                    
                    const now = Date.now();
                    const timeSinceLastBreath = now - lastBreathTime;
                    
                    if (this.shouldInsertSmartBreath(currentWordIndex, timeSinceLastBreath)) {
                        this.insertSmartBreath('every ' + this.wordsBeforeBreath + ' words');
                        lastBreathTime = now;
                    }
                }
                
                if (event.name === 'sentence') {
                    const charIndex = event.charIndex;
                    const pauseDuration = this.detectBreathPause(text, charIndex);
                    
                    if (pauseDuration > 0) {
                        const now = Date.now();
                        const timeSinceLastBreath = now - lastBreathTime;
                        
                        if (timeSinceLastBreath > 500) {
                            console.log('💨 Punctuation breath:', pauseDuration + 'ms');
                            lastBreathTime = now;
                            
                            this.pauseCallbacks.forEach(cb => {
                                try {
                                    cb({ 
                                        duration: pauseDuration, 
                                        charIndex: charIndex,
                                        type: 'punctuation'
                                    });
                                } catch (err) {}
                            });
                            
                            setTimeout(() => {
                                this.resumeCallbacks.forEach(cb => {
                                    try { cb(); } catch (err) {}
                                });
                            }, pauseDuration);
                        }
                    }
                }
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                this.currentUtterance = null;
                console.log('✅ Speech ended');
                
                this.endCallbacks.forEach(cb => {
                    try { cb(); } catch (err) {}
                });
                
                resolve();
            };

            utterance.onerror = (error) => {
                console.error('❌ Speech error:', error);
                this.isSpeaking = false;
                this.currentUtterance = null;
                
                this.endCallbacks.forEach(cb => {
                    try { cb(); } catch (err) {}
                });
                
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

    clearCallbacks() {
        this.boundaryCallbacks = [];
        this.startCallbacks = [];
        this.endCallbacks = [];
        this.pauseCallbacks = [];
        this.resumeCallbacks = [];
    }
}

export const speechManager = new SpeechManager();
