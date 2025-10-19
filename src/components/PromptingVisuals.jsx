import React, { useState, useEffect, useRef } from 'react';
import EyeGlowEffect from './EyeGlowEffect';
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
    const hadFaceOnce = useRef(false);

    const PROMPT_DELAY = 3000;
    const HIDE_DELAY = 500;

    useEffect(() => {
        console.log('👁️ PromptingVisuals mounted!');
        return () => {
            console.log('👁️ PromptingVisuals unmounted');
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    useEffect(() => {
        if (faceDetected) {
            hadFaceOnce.current = true;
        }
    }, [faceDetected]);

    useEffect(() => {
        if (forceShow) {
            console.log('🧪 TEST MODE: Forcing arrows to show!');
            setShowArrows(true);
            return;
        }
    }, [forceShow]);

    useEffect(() => {
        if (forceShow) return;
        if (!isActive) {
            setShowArrows(false);
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }
            eyeContactLostTime.current = null;
            return;
        }

        if (!hadFaceOnce.current && !faceDetected) {
            return;
        }

        if (hasEyeContact !== lastEyeContactValue.current) {
            console.log(`👁️ Eye contact: ${lastEyeContactValue.current} → ${hasEyeContact}`);
            lastEyeContactValue.current = hasEyeContact;
        }

        if (!hasEyeContact) {
            if (!eyeContactLostTime.current) {
                eyeContactLostTime.current = Date.now();
                console.log(`⏱️ Starting ${PROMPT_DELAY}ms timer...`);
            }

            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }

            if (!showArrows) {
                const timeSinceLost = Date.now() - eyeContactLostTime.current;
                const remainingTime = Math.max(0, PROMPT_DELAY - timeSinceLost);
                
                debounceTimer.current = setTimeout(() => {
                    console.log('✨ SHOWING ARROWS + EYE GLOW!');
                    setShowArrows(true);
                    debounceTimer.current = null;
                }, remainingTime);
            }
        } else {
            if (eyeContactLostTime.current) {
                console.log('✅ Eye contact restored');
                eyeContactLostTime.current = null;
            }

            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }

            if (showArrows) {
                debounceTimer.current = setTimeout(() => {
                    console.log('👋 Hiding arrows + eye glow');
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

    if (!showArrows || !isActive) {
        return null;
    }

    return (
        <>
            {/* Phase 1: Arrows and overlay */}
            <div className="prompting-visuals-overlay">
                <div className="focus-circle"></div>
                
                <div className="arrow-container arrow-top">
                    <div className="arrow-pointer">↓</div>
                    <div className="arrow-text">Look at my eyes</div>
                </div>
                
                <div className="arrow-container arrow-left">
                    <div className="arrow-pointer">→</div>
                    <div className="arrow-text">Look here!</div>
                </div>
                
                <div className="arrow-container arrow-right">
                    <div className="arrow-pointer">←</div>
                    <div className="arrow-text">Eyes on me!</div>
                </div>
            </div>

            {/* Phase 2: Eye Glow Effect */}
            <EyeGlowEffect isActive={showArrows} />
        </>
    );
}
