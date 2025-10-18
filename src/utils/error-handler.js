/**
 * Centralized error handling
 */

export class ErrorHandler {
    static handleError(error, context = 'Unknown') {
        console.error(`❌ Error in ${context}:`, error);
        return null;
    }

    static async safeAsync(fn, fallback = null, context = 'Async operation') {
        try {
            return await fn();
        } catch (error) {
            console.error(`❌ ${context} failed:`, error);
            return fallback;
        }
    }

    static safeSync(fn, fallback = null, context = 'Sync operation') {
        try {
            return fn();
        } catch (error) {
            console.error(`❌ ${context} failed:`, error);
            return fallback;
        }
    }
}

export function safeSetState(setter, value, componentName = 'Component') {
    try {
        setter(value);
    } catch (error) {
        console.error(`❌ Failed to update state in ${componentName}:`, error);
    }
}
