import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import '../styles/AvatarRenderer.css';

function AvatarModel({ eyeContact, mode }) {
    const modelUrl = 'https://models.readyplayer.me/68d40895f593c940295b8dec.glb';
    const { scene } = useGLTF(modelUrl);
    const modelRef = useRef();
    const [blinkState, setBlinkState] = useState(0);
    const [smileIntensity, setSmileIntensity] = useState(0);
    const lastEyeContactRef = useRef(false);

    useEffect(() => {
        const blinkInterval = setInterval(() => {
            if (Math.random() > 0.8) {
                setBlinkState(1);
                setTimeout(() => setBlinkState(0), 150);
            }
        }, 8000);

        return () => clearInterval(blinkInterval);
    }, []);

    // FIX: Respond to eye contact changes
    useEffect(() => {
        if (eyeContact && !lastEyeContactRef.current) {
            if (mode === 'prt') {
                const celebrations = [0.6, 0.8, 1.0];
                setSmileIntensity(celebrations[Math.floor(Math.random() * celebrations.length)]);
            } else if (mode === 'prompting') {
                setSmileIntensity(0.7);
            } else if (mode !== 'assessment') {
                setSmileIntensity(0.5);
            }
        } else if (!eyeContact && lastEyeContactRef.current) {
            if (mode !== 'assessment') {
                setSmileIntensity(0);
            }
        }
        
        lastEyeContactRef.current = eyeContact;
    }, [eyeContact, mode]);

    useEffect(() => {
        if (!scene) return;

        scene.traverse((child) => {
            if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
                const dict = child.morphTargetDictionary;
                
                if (dict.mouthSmile !== undefined) {
                    const targetSmile = mode === 'assessment' ? 0 : smileIntensity;
                    child.morphTargetInfluences[dict.mouthSmile] = targetSmile;
                }

                if (dict.eyesClosed !== undefined) {
                    child.morphTargetInfluences[dict.eyesClosed] = blinkState;
                }
            }
        });
    }, [scene, smileIntensity, blinkState, mode]);

    useEffect(() => {
        if (modelRef.current) {
            let animationId;
            const animate = () => {
                if (modelRef.current) {
                    modelRef.current.rotation.y = Math.sin(Date.now() * 0.0003) * 0.1;
                }
                animationId = requestAnimationFrame(animate);
            };
            animate();
            
            return () => {
                if (animationId) cancelAnimationFrame(animationId);
            };
        }
    }, []);

    return (
        <primitive 
            ref={modelRef}
            object={scene} 
            scale={2.5} 
            position={[0, -4.2, 0]}
        />
    );
}

export default function MorphTargetAvatar({ eyeContact = false, mode = 'prompting' }) {
    return (
        <div className="avatar-renderer-large">
            <Canvas 
                camera={{ position: [0, 0.5, 7], fov: 9 }}
                gl={{ 
                    antialias: false, 
                    powerPreference: "low-power",
                    preserveDrawingBuffer: false
                }}
            >
                <ambientLight intensity={1.2} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <Suspense fallback={null}>
                    <AvatarModel eyeContact={eyeContact} mode={mode} />
                </Suspense>
            </Canvas>
            <p className="avatar-status-large">
                {eyeContact ? 'Great eye contact!' : 'Look at me'}
            </p>
        </div>
    );
}
