/**
 * Central configuration for the entire app
 */

export const APP_CONFIG = {
    // Lip-sync timing
    lipSync: {
        microMovementInterval: 60,
        speechLerpSpeed: 0.8,
        breathLerpSpeed: 0.3,
        breathDurations: {
            period: 600,
            comma: 300,
            colon: 400,
            semicolon: 300
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
        debounceTime: 1500,              // Initial delay before first prompt
        repeatedPromptInterval: 5000,    // Repeat prompt every 5s while looking away
        smileDebounceTime: 1500,
        neutralDebounceTime: 1500,
        accuracyThreshold: 0.05
    },

    // Snippet system
    snippets: {
        advanceDelay: 100,
        replayDelay: 1000,
        interruptionProtection: 3000
    },

    // Avatar settings
    avatar: {
        blinkInterval: 8000,
        blinkDuration: 150,
        modelScale: 2.5,
        modelPosition: [0, -4.0, 0],
        smileTransitionSpeed: 0.1
    },

    // Mode descriptions
    modes: {
        assessment: {
            name: 'Assessment Mode',
            description: 'Baseline measurement',
            allowsPrompts: false
        },
        prompting: {
            name: 'Prompting Mode',
            description: 'Visual guidance',
            allowsPrompts: true
        },
        prt: {
            name: 'PRT Mode',
            description: 'Reinforcement training',
            allowsPrompts: true
        },
        research: {
            name: 'Research Mode',
            description: 'Data collection',
            allowsPrompts: false
        }
    }
};

export function validateConfig() {
    const errors = [];
    
    if (APP_CONFIG.lipSync.speechLerpSpeed < 0 || APP_CONFIG.lipSync.speechLerpSpeed > 1) {
        errors.push('speechLerpSpeed must be between 0 and 1');
    }
    
    if (APP_CONFIG.snippets.advanceDelay < 0) {
        errors.push('advanceDelay must be positive');
    }
    
    if (APP_CONFIG.eyeContact.debounceTime < 500) {
        errors.push('debounceTime should be at least 500ms');
    }
    
    if (errors.length > 0) {
        console.error('❌ Configuration errors:', errors);
        return false;
    }
    
    console.log('✅ Configuration validated');
    return true;
}
