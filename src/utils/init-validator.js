/**
 * System initialization validator
 */

import { APP_CONFIG, validateConfig } from '../config/app-config';
import { lipSyncController } from './lip-sync-controller';

export class InitValidator {
    static validate() {
        console.log('🔍 Validating system initialization...');
        
        const checks = [
            this.checkConfig(),
            this.checkWebSpeech(),
            this.checkLipSync()
        ];

        const allPassed = checks.every(check => check === true);

        if (allPassed) {
            console.log('✅ All systems validated');
        } else {
            console.warn('⚠️ Some validation checks failed');
        }

        return allPassed;
    }

    static checkConfig() {
        try {
            const valid = validateConfig();
            return valid;
        } catch (error) {
            console.error('❌ Config validation failed:', error);
            return false;
        }
    }

    static checkWebSpeech() {
        if (!window.speechSynthesis) {
            console.error('❌ Web Speech API not available');
            return false;
        }
        console.log('✅ Web Speech API available');
        return true;
    }

    static checkLipSync() {
        if (!lipSyncController) {
            console.error('❌ Lip-sync controller not initialized');
            return false;
        }
        console.log('✅ Lip-sync controller available');
        return true;
    }
}
