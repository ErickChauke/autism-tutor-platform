import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import '../styles/AvatarRenderer.css';

function AvatarModel({ url, eyeContact }) {
    const { scene } = useGLTF(url);
    const modelRef = useRef();

    useEffect(() => {
        if (modelRef.current) {
            const animate = () => {
                if (modelRef.current) {
                    modelRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.15;
                }
                requestAnimationFrame(animate);
            };
            animate();
        }
    }, []);

    const scale = eyeContact ? 2.5 : 2.5;

    return (
        <primitive 
            ref={modelRef}
            object={scene} 
            scale={scale} 
            position={[0, -4.2, 0]}
        />
    );
}

export default function ReadyPlayerMeAvatar({ eyeContact = false }) {
    const avatarUrl = 'https://models.readyplayer.me/68d40895f593c940295b8dec.glb';

    return (
        <div className="avatar-renderer-large">
            <Canvas camera={{ position: [0, 0.5, 7], fov: 9 }}>
                <ambientLight intensity={1.2} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <directionalLight position={[-5, 3, -5]} intensity={0.5} />
                <Suspense fallback={null}>
                    <AvatarModel url={avatarUrl} eyeContact={eyeContact} />
                </Suspense>
            </Canvas>
            <p className="avatar-status-large">
                {eyeContact ? 'Great eye contact!' : 'Look at me'}
            </p>
        </div>
    );
}
