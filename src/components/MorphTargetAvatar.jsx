import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import '../styles/AvatarRenderer.css';

function AvatarModel({ eyeContact }) {
    const modelUrl = 'https://models.readyplayer.me/68d40895f593c940295b8dec.glb';
    const { scene } = useGLTF(modelUrl);
    const modelRef = useRef();

    useEffect(() => {
        if (!scene) return;

        scene.traverse((child) => {
            if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
                const dict = child.morphTargetDictionary;
                
                // Only use mouthSmile for clearer expression
                if (dict.mouthSmile !== undefined) {
                    child.morphTargetInfluences[dict.mouthSmile] = eyeContact ? 1 : 0;
                }
            }
        });
    }, [eyeContact, scene]);

    useEffect(() => {
        if (modelRef.current) {
            let animationId;
            const animate = () => {
                if (modelRef.current) {
                    modelRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.15;
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

export default function MorphTargetAvatar({ eyeContact = false }) {
    return (
        <div className="avatar-renderer-large">
            <Canvas camera={{ position: [0, 0.5, 7], fov: 9 }}>
                <ambientLight intensity={1.2} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <Suspense fallback={null}>
                    <AvatarModel eyeContact={eyeContact} />
                </Suspense>
            </Canvas>
            <p className="avatar-status-large">
                {eyeContact ? 'Great eye contact!' : 'Look at me'}
            </p>
        </div>
    );
}
