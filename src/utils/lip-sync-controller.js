/**
 * LipSyncController - Robust version with error handling
 */

import { APP_CONFIG } from '../config/app-config';
import { ErrorHandler } from './error-handler';

export class LipSyncController {
    constructor() {
        this.isActive = false;
        this.animationFrame = null;
        this.currentUtterance = null;
        this.mouthOpenTarget = 0;
        this.mouthOpenCurrent = 0;
        this.lastUpdateTime = 0;
        this.isSpeaking = false;
        this.isBreathing = false;
        
        this.currentWordStartTime = 0;
        this.microMovementIndex = 0;
        this.microMovementInterval = APP_CONFIG.lipSync.microMovementInterval;
        
        console.log('👄 LipSyncController initialized');
    }

    start(utterance, onEndCallback) {
        if (!utterance) {
            console.error('❌ Cannot start lip-sync: no utterance provided');
            return;
        }

        this.currentUtterance = utterance;
        this.isSpeaking = true;
        this.isBreathing = false;
        this.currentWordStartTime = 0;
        this.microMovementIndex = 0;
        
        utterance.onstart = () => {
            ErrorHandler.safeSync(() => {
                console.log('👄 Lip sync started');
                this.isActive = true;
                this.lastUpdateTime = Date.now();
                this.currentWordStartTime = Date.now();
                this.animate();
            }, null, 'Lip-sync start');
        };

        utterance.onboundary = (event) => {
            ErrorHandler.safeSync(() => {
                if (event.name === 'word') {
                    const text = utterance.text;
                    if (!text) return;
                    
                    const currentWord = text.substring(event.charIndex).split(/\s+/)[0];
                    console.log('👄 Word:', currentWord);
                    
                    this.currentWordStartTime = Date.now();
                    this.microMovementIndex = 0;
                    
                    if (!this.isBreathing) {
                        this.triggerWordMovement(currentWord);
                    }
                }
                
                if (event.name === 'sentence') {
                    const text = utterance.text;
                    if (!text) return;
                    
                    const char = text[event.charIndex];
                    this.handlePunctuation(char);
                }
            }, null, 'Boundary event');
        };

        utterance.onend = () => {
            ErrorHandler.safeSync(() => {
                console.log('👄 Lip sync ended');
                this.mouthOpenTarget = 0;
                this.isBreathing = true;
                
                setTimeout(() => {
                    this.stop();
                    if (onEndCallback) onEndCallback();
                }, 200);
            }, null, 'Lip-sync end');
        };

        utterance.onerror = (error) => {
            console.error('❌ Speech error:', error);
            this.stop();
            if (onEndCallback) onEndCallback();
        };
    }

    handlePunctuation(char) {
        const durations = APP_CONFIG.lipSync.breathDurations;
        
        if (char === '.' || char === '!' || char === '?') {
            console.log('💨 Period breath');
            this.triggerBreath(durations.period);
        } else if (char === ',') {
            console.log('💨 Comma breath');
            this.triggerBreath(durations.comma);
        } else if (char === ';') {
            console.log('💨 Semicolon breath');
            this.triggerBreath(durations.semicolon);
        } else if (char === ':') {
            console.log('💨 Colon breath');
            this.triggerBreath(durations.colon);
        }
    }

    triggerBreath(duration) {
        this.isBreathing = true;
        this.mouthOpenTarget = 0;
        
        setTimeout(() => {
            this.isBreathing = false;
        }, duration);
    }

    triggerWordMovement(word) {
        if (!word) return;
        
        const w = word.toLowerCase();
        let baseOpen;
        
        if (/^[aeiou]/.test(w) || w.includes('ah') || w.includes('aw')) {
            baseOpen = 0.7;
        } else if (w.includes('ee') || w.includes('ea') || /^[e]/.test(w)) {
            baseOpen = 0.5;
        } else if (w.includes('oo') || w.includes('ou') || /^[o]/.test(w)) {
            baseOpen = 0.6;
        } else if (/^[mbp]/.test(w)) {
            baseOpen = 0.15;
        } else {
            baseOpen = 0.4;
        }
        
        this.mouthOpenTarget = baseOpen + (Math.random() * 0.15 - 0.075);
        this.mouthOpenTarget = Math.max(0.1, Math.min(0.9, this.mouthOpenTarget));
    }

    stop() {
        this.isActive = false;
        this.isSpeaking = false;
        this.isBreathing = false;
        this.mouthOpenTarget = 0;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    animate() {
        if (!this.isActive) return;

        ErrorHandler.safeSync(() => {
            const now = Date.now();
            const timeSinceWord = now - this.currentWordStartTime;
            
            if (!this.isBreathing && 
                timeSinceWord > this.microMovementIndex * this.microMovementInterval) {
                const variation = (Math.random() * 0.2 - 0.1);
                const newTarget = this.mouthOpenTarget + variation;
                this.mouthOpenTarget = Math.max(0.1, Math.min(0.9, newTarget));
                this.microMovementIndex++;
            }

            const lerpSpeed = this.isBreathing 
                ? APP_CONFIG.lipSync.breathLerpSpeed 
                : APP_CONFIG.lipSync.speechLerpSpeed;
            
            this.mouthOpenCurrent += (this.mouthOpenTarget - this.mouthOpenCurrent) * lerpSpeed;
            this.mouthOpenCurrent = Math.max(0, Math.min(1, this.mouthOpenCurrent));

            this.animationFrame = requestAnimationFrame(() => this.animate());
        }, null, 'Animation frame');
    }

    getMouthOpen() {
        return this.mouthOpenCurrent;
    }

    getSpeaking() {
        return this.isSpeaking;
    }

    getBreathing() {
        return this.isBreathing;
    }

    destroy() {
        this.stop();
    }
}

export const lipSyncController = new LipSyncController();
