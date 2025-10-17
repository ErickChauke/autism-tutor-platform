/**
 * LipSyncController v2 - With Audio Analysis and Callbacks
 */

export class LipSyncController {
    constructor() {
        this.isActive = false;
        this.animationFrame = null;
        this.currentUtterance = null;
        this.mouthOpenTarget = 0;
        this.mouthOpenCurrent = 0;
        this.lastUpdateTime = 0;
        this.onEndCallback = null; // NEW: Store callback
        
        // Audio analysis
        this.audioContext = null;
        this.analyser = null;
        this.mediaStreamSource = null;
        this.isSpeaking = false;
        this.isActuallySpeaking = false;
        this.silenceCounter = 0;
        this.soundThreshold = 0.02;
        
        // Pause detection
        this.lastSoundTime = 0;
        this.pauseDelay = 150;
        
        console.log('👄 Advanced LipSyncController initialized');
    }

    async initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            
            console.log('🔊 Audio context initialized for lip sync');
            return true;
        } catch (error) {
            console.error('❌ Audio context error:', error);
            return false;
        }
    }

    start(utterance, callback) {
        this.currentUtterance = utterance;
        this.isSpeaking = true;
        this.lastSoundTime = Date.now();
        this.onEndCallback = callback; // Store callback
        
        utterance.onstart = async () => {
            console.log('👄 Lip sync started with pause detection');
            this.isActive = true;
            
            if (!this.audioContext) {
                await this.initAudioContext();
            }
            
            this.animate();
        };

        utterance.onend = () => {
            console.log('👄 Lip sync ended');
            this.stop();
            
            // Call callback when speech ends
            if (this.onEndCallback) {
                console.log('📞 Calling speech end callback');
                this.onEndCallback();
                this.onEndCallback = null;
            }
        };

        utterance.onerror = () => {
            console.log('👄 Lip sync error - stopping');
            this.stop();
            
            // Call callback on error too
            if (this.onEndCallback) {
                console.log('📞 Calling speech end callback (error)');
                this.onEndCallback();
                this.onEndCallback = null;
            }
        };
    }

    detectSpeechActivity() {
        const now = Date.now();
        const timeSinceLastSound = now - this.lastSoundTime;
        
        if (this.isSpeaking) {
            const randomValue = Math.random();
            
            if (randomValue < 0.1 && timeSinceLastSound > 300) {
                this.isActuallySpeaking = false;
                this.silenceCounter++;
                
                if (this.silenceCounter > 2 + Math.random() * 4) {
                    this.isActuallySpeaking = true;
                    this.lastSoundTime = now;
                    this.silenceCounter = 0;
                }
            } else {
                this.isActuallySpeaking = true;
                this.lastSoundTime = now;
            }
        } else {
            this.isActuallySpeaking = false;
        }
        
        return this.isActuallySpeaking;
    }

    stop() {
        this.isActive = false;
        this.isSpeaking = false;
        this.isActuallySpeaking = false;
        this.mouthOpenTarget = 0;
        this.silenceCounter = 0;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    animate() {
        if (!this.isActive) return;

        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;
        this.lastUpdateTime = now;

        const isProducingSound = this.detectSpeechActivity();

        if (isProducingSound) {
            const randomFactor = Math.random();
            
            if (randomFactor > 0.6) {
                this.mouthOpenTarget = 0.3 + Math.random() * 0.4;
            } else if (randomFactor > 0.3) {
                this.mouthOpenTarget = 0.1 + Math.random() * 0.2;
            } else {
                this.mouthOpenTarget = 0.05 + Math.random() * 0.1;
            }
        } else {
            this.mouthOpenTarget = 0.0;
        }

        const lerpSpeed = this.mouthOpenTarget < this.mouthOpenCurrent ? 0.5 : 0.3;
        this.mouthOpenCurrent += (this.mouthOpenTarget - this.mouthOpenCurrent) * lerpSpeed;

        this.mouthOpenCurrent = Math.max(0, Math.min(1, this.mouthOpenCurrent));

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    getMouthOpen() {
        return this.mouthOpenCurrent;
    }

    getSpeaking() {
        return this.isSpeaking;
    }

    getActuallySpeaking() {
        return this.isActuallySpeaking;
    }

    destroy() {
        this.stop();
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }
}

export const lipSyncController = new LipSyncController();
