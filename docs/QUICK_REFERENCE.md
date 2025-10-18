# Quick Reference

## 🔧 Common Tasks

### Change Lip-Sync Speed
```javascript
// Edit: src/config/app-config.js
lipSync: {
    microMovementInterval: 60,    // Lower = faster
    speechLerpSpeed: 0.8,         // Higher = faster (max 1.0)
}
```

### Add New Topic
```javascript
// Edit: src/utils/content-manager.js
educationalSnippets: {
    yourTopic: [
        "First snippet.",
        "Second snippet.",
        "Third snippet."
    ]
}
```

### Change Voice Settings
```javascript
// Edit: src/config/app-config.js
speech: {
    rate: 0.9,     // 0.1 - 2.0
    pitch: 1.1,    // 0.0 - 2.0
    volume: 1.0    // 0.0 - 1.0
}
```

### Add Attention Prompt
```javascript
// Edit: src/utils/content-manager.js
attentionPrompts: [
    "Your new prompt here!"
]
```

## 📝 File Locations

| What | Where |
|------|-------|
| Configuration | `src/config/app-config.js` |
| Content | `src/utils/content-manager.js` |
| Lip-sync | `src/utils/lip-sync-controller.js` |
| Avatar | `src/components/MorphTargetAvatar.jsx` |
| Face tracking | `src/components/FaceTracker.jsx` |
| Education | `src/components/EducationEngine.jsx` |

## 🐛 Debugging

### Check System Status
```javascript
// In browser console:
import { InitValidator } from './utils/init-validator';
InitValidator.validate();
```

### View Configuration
```javascript
// In browser console:
import { APP_CONFIG } from './config/app-config';
console.log(APP_CONFIG);
```

## 🎯 Testing

### Test Lip-Sync
1. Start app
2. Select PRT/Prompting mode
3. Click "Animals"
4. Watch console for: `👄 Word: Elephants`
5. Mouth should move with each word

### Test Eye Contact
1. Look at camera
2. Look away for 1.5 seconds
3. Should hear: "Let's make eye contact!"
4. Look back
5. Should hear: "Great! You're back!"
