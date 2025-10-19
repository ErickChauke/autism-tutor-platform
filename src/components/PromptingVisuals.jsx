import React, { useState, useEffect, useRef } from 'react';
import '../styles/PromptingVisuals.css';

export default function PromptingVisuals({ 
    hasEyeContact, 
    faceDetected, 
    isActive = true,
    forceShow = false
}) {
    const [showArrows, setShowArrows] = useState(false);
    const debounceTimer = useRef(null);
    const eyeContactLostTime = useRef(null);
    const lastEyeContactValue = useRef(hasEyeContact);
    const hadFaceOnce = useRef(false); // Track if we've had face detection at least once

    const PROMPT_DELAY = 3000;
    const HIDE_DELAY = 500;

    useEffect(() => {
        console.log('👁️ PromptingVisuals mounted!');
        console.log(`   Props: active=${isActive}, face=${faceDetected}, eye=${hasEyeContact}`);
        return () => {
            console.log('👁️ PromptingVisuals unmounted');
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    // Track if we've ever had face detection
    useEffect(() => {
        if (faceDetected) {
            hadFaceOnce.current = true;
            console.log('✅ Face detected - system active');
        }
    }, [faceDetected]);

    // Manual override for testing
    useEffect(() => {
        if (forceShow) {
            console.log('🧪 TEST MODE: Forcing arrows to show!');
            setShowArrows(true);
            return;
        }
    }, [forceShow]);

    useEffect(() => {
        if (forceShow) {
            return;
        }

        if (!isActive) {
            console.log('⏸️ Component inactive - clearing arrows');
            setShowArrows(false);
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }
            eyeContactLostTime.current = null;
            return;
        }

        // CRITICAL FIX: Only require face detection on first run
        // Don't let brief face loss cancel the arrow timer
        if (!hadFaceOnce.current && !faceDetected) {
            console.log('👤 Waiting for initial face detection...');
            return;
        }

        // Log eye contact state changes
        if (hasEyeContact !== lastEyeContactValue.current) {
            console.log(`👁️ Eye contact changed: ${lastEyeContactValue.current} → ${hasEyeContact}`);
            lastEyeContactValue.current = hasEyeContact;
        }

        // Eye contact LOST - start timer to show arrows
        if (!hasEyeContact) {
            if (!eyeContactLostTime.current) {
                eyeContactLostTime.current = Date.now();
                const timeStr = new Date().toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit',
                    fractionalSecondDigits: 3
                });
                console.log(`⏱️ Eye contact lost at ${timeStr} - starting ${PROMPT_DELAY}ms timer...`);
            }

            // Clear any existing hide timer
            if (debounceTimer.current) {
                console.log('🧹 Clearing existing hide timer');
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }

            // Start show timer
            if (!showArrows) {
                const timeSinceLost = Date.now() - eyeContactLostTime.current;
                const remainingTime = Math.max(0, PROMPT_DELAY - timeSinceLost);
                
                console.log(`⏲️ Setting show timer for ${remainingTime}ms (${timeSinceLost}ms already elapsed)`);
                
                debounceTimer.current = setTimeout(() => {
                    console.log('🎯🎯🎯 SHOWING ARROWS NOW - 3 SECONDS ELAPSED! 🎯🎯🎯');
                    setShowArrows(true);
                    debounceTimer.current = null;
                }, remainingTime);
            } else {
                console.log('➡️ Arrows already showing');
            }
        } 
        // Eye contact RESTORED - hide arrows after short delay
        else {
            if (eyeContactLostTime.current) {
                const duration = ((Date.now() - eyeContactLostTime.current) / 1000).toFixed(1);
                console.log(`✅ Eye contact restored after ${duration}s!`);
                eyeContactLostTime.current = null;
            }

            // Clear any existing show timer
            if (debounceTimer.current) {
                console.log('🧹 Clearing show timer (eye contact restored)');
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }

            // If arrows are showing, hide them after brief delay
            if (showArrows) {
                console.log(`⏲️ Hiding arrows in ${HIDE_DELAY}ms...`);
                debounceTimer.current = setTimeout(() => {
                    console.log('👋 Hiding arrows now');
                    setShowArrows(false);
                    debounceTimer.current = null;
                }, HIDE_DELAY);
            }
        }

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [hasEyeContact, faceDetected, isActive, showArrows, forceShow]);

    if (!showArrows) {
        return null;
    }

    if (!isActive) {
        return null;
    }

    console.log('🎨🎨🎨 RENDERING ARROWS! 🎨🎨🎨');

    return (
        <div className="prompting-visuals-overlay">
            <div className="arrow-container arrow-top-left">
                <div className="arrow-pointer">↘</div>
                <div className="arrow-text">Look here!</div>
            </div>
            
            <div className="arrow-container arrow-top-right">
                <div className="arrow-pointer">↙</div>
                <div className="arrow-text">Eyes on me!</div>
            </div>
            
            <div className="arrow-container arrow-center">
                <div className="arrow-pointer">👀</div>
                <div className="arrow-text">LOOK AT MY EYES!</div>
            </div>
        </div>
    );
}
