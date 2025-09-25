import React from 'react';
import AssessmentMode from './modes/AssessmentMode';
import PromptingMode from './modes/PromptingMode';
import PRTMode from './modes/PRTMode';
import '../styles/FaceTracker.css';

export default function FaceTracker({ mode, onBack }) {
    const renderMode = () => {
        switch(mode) {
            case 'assessment':
                return <AssessmentMode onBack={onBack} />;
            case 'prompting':
                return <PromptingMode onBack={onBack} />;
            case 'prt':
                return <PRTMode onBack={onBack} />;
            case 'research':
                return <AssessmentMode onBack={onBack} />; // Use assessment for now
            default:
                return <AssessmentMode onBack={onBack} />;
        }
    };

    return renderMode();
}
