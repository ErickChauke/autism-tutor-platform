/**
 * Central configuration for the entire app
 * Change settings here without breaking code
 */

export const APP_CONFIG = {
    // Lip-sync timing
    lipSync: {
        microMovementInterval: 60,      // ms between micro-movements
        speechLerpSpeed: 0.8,            // Fast transitions during speech
        breathLerpSpeed: 0.3,            // Smooth closing during breath
        breathDurations: {
            period: 600,                 // ms
            comma: 300,                  // ms
            colon: 400,                  // ms
            semicolon: 300               // ms
        }
    },

    // Speech settings
    speech: {
        rate: 0.9,
        pitch: 1.1,
        volume: 1.0,
        voicePreferences: ['Zira', 'Female', 'Google', 'Samantha']
    },

    // Eye contact detection
    eyeContact: {
        debounceTime: 1500,              // ms before confirming loss
        promptCooldown: 10000,           // ms between prompts
        accuracyThreshold: 0.05          // Lower = stricter
    },

    // Snippet system
    snippets: {
        advanceDelay: 100,               // ms between snippets
        replayDelay: 1000,               // ms before replay
        interruptionProtection: 3000     // ms protection window
    },

    // Avatar settings
    avatar: {
        blinkInterval: 8000,             // ms
        blinkDuration: 150,              // ms
        modelScale: 2.5,
        modelPosition: [0, -4.0, 0]
    },

    // Mode descriptions
    modes: {
        assessment: {
            name: 'Assessment Mode',
            description: 'Silent baseline measurement',
            allowsPrompts: false
        },
        prompting: {
            name: 'Prompting Mode',
            description: 'Visual cues guide attention',
            allowsPrompts: true
        },
        prt: {
            name: 'PRT Mode',
            description: 'Positive reinforcement training',
            allowsPrompts: true
        },
        research: {
            name: 'Research Mode',
            description: 'Controlled data collection',
            allowsPrompts: false
        }
    }
};

// Validation function
export function validateConfig() {
    const errors = [];
    
    if (APP_CONFIG.lipSync.speechLerpSpeed < 0 || APP_CONFIG.lipSync.speechLerpSpeed > 1) {
        errors.push('speechLerpSpeed must be between 0 and 1');
    }
    
    if (APP_CONFIG.snippets.advanceDelay < 0) {
        errors.push('advanceDelay must be positive');
    }
    
    if (errors.length > 0) {
        console.error('❌ Configuration errors:', errors);
        return false;
    }
    
    console.log('✅ Configuration validated');
    return true;
}
