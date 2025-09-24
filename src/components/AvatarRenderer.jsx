import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import '../styles/AvatarRenderer.css';

export default function AvatarRenderer({ eyeContact = false }) {
    const mountRef = useRef(null);
    const rendererRef = useRef(null);
    const mouthRef = useRef(null);
    const leftEyeRef = useRef(null);
    const rightEyeRef = useRef(null);
    const [currentRotation, setCurrentRotation] = useState(0);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;
        
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xe8f4f8);

        const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.z = 3.5;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        currentMount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

        // Face with gradient effect
        const faceGeometry = new THREE.CircleGeometry(1, 64);
        const faceMaterial = new THREE.MeshBasicMaterial({ color: 0xffd4a3 });
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        scene.add(face);

        // Eyes with white background
        const eyeWhiteGeometry = new THREE.CircleGeometry(0.15, 32);
        const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        const leftEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
        leftEyeWhite.position.set(-0.3, 0.2, 0.01);
        scene.add(leftEyeWhite);

        const rightEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
        rightEyeWhite.position.set(0.3, 0.2, 0.01);
        scene.add(rightEyeWhite);

        // Pupils
        const pupilGeometry = new THREE.CircleGeometry(0.08, 32);
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x2c3e50 });
        
        const leftEye = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftEye.position.set(-0.3, 0.2, 0.02);
        leftEyeRef.current = leftEye;
        scene.add(leftEye);

        const rightEye = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightEye.position.set(0.3, 0.2, 0.02);
        rightEyeRef.current = rightEye;
        scene.add(rightEye);

        // Eyebrows
        const browGeometry = new THREE.PlaneGeometry(0.25, 0.05);
        const browMaterial = new THREE.MeshBasicMaterial({ color: 0x8b6f47 });
        
        const leftBrow = new THREE.Mesh(browGeometry, browMaterial);
        leftBrow.position.set(-0.3, 0.45, 0.01);
        scene.add(leftBrow);

        const rightBrow = new THREE.Mesh(browGeometry, browMaterial);
        rightBrow.position.set(0.3, 0.45, 0.01);
        scene.add(rightBrow);

        // Mouth
        const mouthCurve = new THREE.EllipseCurve(0, 0, 0.4, 0.2, 0, Math.PI, false);
        const mouthPoints = mouthCurve.getPoints(50);
        const mouthGeometry = new THREE.BufferGeometry().setFromPoints(mouthPoints);
        const mouthMaterial = new THREE.LineBasicMaterial({ color: 0xe74c3c, linewidth: 4 });
        const mouth = new THREE.Line(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.3, 0.01);
        mouth.rotation.z = 0;
        mouthRef.current = mouth;
        scene.add(mouth);

        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            
            // Smooth mouth transition
            if (mouthRef.current) {
                const targetRotation = eyeContact ? Math.PI : 0;
                const diff = targetRotation - mouthRef.current.rotation.z;
                mouthRef.current.rotation.z += diff * 0.1;
            }

            // Eye blink animation
            const time = Date.now() * 0.001;
            if (Math.sin(time * 2) > 0.98) {
                if (leftEyeRef.current) leftEyeRef.current.scale.y = 0.3;
                if (rightEyeRef.current) rightEyeRef.current.scale.y = 0.3;
            } else {
                if (leftEyeRef.current) leftEyeRef.current.scale.y = 1;
                if (rightEyeRef.current) rightEyeRef.current.scale.y = 1;
            }

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            if (currentMount && renderer.domElement && currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [eyeContact]);

    useEffect(() => {
        if (!mouthRef.current) return;

        const mouth = mouthRef.current;
        const targetRotation = eyeContact ? Math.PI : 0;
        const targetScale = eyeContact ? 1.3 : 1;

        // Smooth transition
        const interval = setInterval(() => {
            const rotDiff = targetRotation - mouth.rotation.z;
            const scaleDiff = targetScale - mouth.scale.x;
            
            if (Math.abs(rotDiff) < 0.01 && Math.abs(scaleDiff) < 0.01) {
                mouth.rotation.z = targetRotation;
                mouth.scale.set(targetScale, targetScale, 1);
                clearInterval(interval);
            } else {
                mouth.rotation.z += rotDiff * 0.15;
                mouth.scale.x += scaleDiff * 0.15;
                mouth.scale.y += scaleDiff * 0.15;
            }
        }, 16);

        return () => clearInterval(interval);
    }, [eyeContact]);

    return (
        <div className="avatar-renderer">
            <div ref={mountRef} className="avatar-canvas" />
            <p className="avatar-status">
                {eyeContact ? '😊 Great eye contact!' : '☹️ Look at me'}
            </p>
        </div>
    );
}
