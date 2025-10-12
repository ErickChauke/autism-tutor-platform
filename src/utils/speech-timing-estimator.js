/**
 * SpeechTimingEstimator
 * Estimates pauses based on text analysis (punctuation, sentence structure)
 */

export class SpeechTimingEstimator {
    constructor() {
        this.text = '';
        this.segments = [];
        this.currentSegment = 0;
        this.startTime = 0;
        this.isActive = false;
    }

    /**
     * Analyze text to predict pauses
     */
    analyzeText(text, rate = 0.9) {
        this.text = text;
        this.segments = [];
        
        // Split by punctuation (natural pauses)
        const sentences = text.split(/([.!?,:;])/);
        
        let timeOffset = 0;
        const avgWordsPerMinute = 150 / rate; // Adjusted by speech rate
        const msPerWord = (60 * 1000) / avgWordsPerMinute;
        
        for (let i = 0; i < sentences.length; i++) {
            const segment = sentences[i].trim();
            if (!segment) continue;
            
            const wordCount = segment.split(/\s+/).length;
            const duration = wordCount * msPerWord;
            
            // Determine pause duration based on punctuation
            let pauseDuration = 0;
            if (segment === '.' || segment === '!' || segment === '?') {
                pauseDuration = 400; // Long pause after sentence
            } else if (segment === ',' || segment === ';' || segment === ':') {
                pauseDuration = 200; // Short pause after comma
            }
            
            this.segments.push({
                text: segment,
                startTime: timeOffset,
                duration: duration,
                pauseAfter: pauseDuration
            });
            
            timeOffset += duration + pauseDuration;
        }
        
        console.log('📝 Speech timing analyzed:', this.segments.length, 'segments');
    }

    /**
     * Start timing
     */
    start(text, rate = 0.9) {
        this.analyzeText(text, rate);
        this.startTime = Date.now();
        this.currentSegment = 0;
        this.isActive = true;
    }

    /**
     * Stop timing
     */
    stop() {
        this.isActive = false;
        this.currentSegment = 0;
    }

    /**
     * Check if currently in a speaking segment (not pause)
     */
    isSpeakingNow() {
        if (!this.isActive || this.segments.length === 0) {
            return false;
        }

        const elapsed = Date.now() - this.startTime;
        
        // Find current segment
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            const segmentEnd = segment.startTime + segment.duration;
            const pauseEnd = segmentEnd + segment.pauseAfter;
            
            if (elapsed >= segment.startTime && elapsed < segmentEnd) {
                // Currently speaking this segment
                return true;
            } else if (elapsed >= segmentEnd && elapsed < pauseEnd) {
                // Currently in pause after this segment
                return false;
            }
        }
        
        // Past all segments
        return false;
    }

    /**
     * Get progress (0-1)
     */
    getProgress() {
        if (!this.isActive || this.segments.length === 0) {
            return 0;
        }

        const elapsed = Date.now() - this.startTime;
        const totalDuration = this.segments[this.segments.length - 1].startTime + 
                             this.segments[this.segments.length - 1].duration +
                             this.segments[this.segments.length - 1].pauseAfter;
        
        return Math.min(1, elapsed / totalDuration);
    }
}

export const speechTimingEstimator = new SpeechTimingEstimator();
