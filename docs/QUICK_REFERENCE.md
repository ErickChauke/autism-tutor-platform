# Quick Reference Guide

## 🚀 Starting the Application

```bash
npm start
```
Opens at: http://localhost:3000

## 🎮 User Flow

1. **Select Mode** → Click one of 4 mode cards
2. **Start Training** → Click "Start [Mode Name]"
3. **Begin Tracking** → Click "Start Tracking"
4. **Interact** → Look at camera, make eye contact
5. **Learn** (PRT mode only) → Click topic buttons

## 🎯 Mode Descriptions

| Mode | Purpose | Avatar Behavior | Education |
|------|---------|-----------------|-----------|
| **Assessment** | Baseline measurement | Neutral (no reactions) | Not shown |
| **Prompting** | Visual guidance | Moderate smile (0.7) | Not shown |
| **PRT** | Reward-based training | Variable celebration (0.6-1.0) | ✅ Active |
| **Research** | Controlled testing | Standardized responses | Not shown |

## 🤖 EducationEngine (PRT Mode Only)

### Features
- 🟢 **AI Active**: Using OpenAI GPT-3.5-turbo
- 🟠 **Fallback Content**: Using pre-written content

### Topics
1. **Animals** - Facts about animals
2. **Space** - Solar system and astronomy
3. **Colors** - Primary colors and mixing
4. **Numbers** - Counting and math basics

### Automatic Triggers
- Every 50 score points → Random educational content
- Manual trigger → Click any topic button

## 🔑 API Key Setup

### Check Current Status
Look at EducationEngine badge:
- 🟢 Green "AI Active" = API working
- 🟠 Orange "Fallback" = No API key (still works!)

### Add API Key
1. Create `.env` file in project root
2. Add: `REACT_APP_OPENAI_KEY=sk-proj-YOUR_KEY`
3. Restart: `npm start`

### Get API Key
1. Visit: https://platform.openai.com/api-keys
2. Sign up / Log in
3. Create new secret key
4. Copy to `.env` file

## 🧪 Testing

### Test OpenAI Connection
```javascript
// In browser console:
import { testOpenAIConnection } from './utils/test-openai.js';
testOpenAIConnection();
```

### Quick Component Tests
- ✅ Camera permission prompt appears
- ✅ Face detection shows colored dots
- ✅ Avatar responds to eye contact
- ✅ Score increases in PRT mode
- ✅ Topic buttons generate content
- ✅ Text-to-speech plays audio

## 📊 Understanding the Display

### Camera View
- **Gray dots** (Assessment): Neutral tracking
- **Blue dots**: No eye contact
- **Green dots** (Prompting): Eye contact detected
- **Gold dots** (PRT): Eye contact with rewards

### Score System (PRT Mode)
- +10 points per eye contact event
- Milestone at every 50 points
- Progress bar shows engagement

### Conversation History
- Shows last 3 topics discussed
- Most recent topic highlighted in green

## ⚙️ Customization

### Change Speech Settings
File: `src/components/EducationEngine.jsx`
```javascript
utterance.rate = 0.85;   // Speed (0.1-10)
utterance.pitch = 1.1;   // Pitch (0-2)
utterance.volume = 0.9;  // Volume (0-1)
```

### Add New Topics
File: `src/components/EducationEngine.jsx`
```javascript
education: {
    animals: "...",
    space: "...",
    newTopic: "Your content here..."  // Add here
}
```

### Adjust Milestone Frequency
File: `src/components/EducationEngine.jsx`
```javascript
if (eyeContactScore % 50 === 0) {  // Change 50
    generateContent(randomTopic);
}
```

## 🐛 Troubleshooting

### Camera Not Working
1. Check browser permissions
2. Ensure HTTPS or localhost
3. Only one app can use camera at a time

### Avatar Not Loading
1. Check internet connection (Ready Player Me requires online)
2. Wait 5-10 seconds for 3D model load
3. Check browser console for errors

### No Speech Output
1. Check system volume
2. Ensure browser allows audio autoplay
3. Try clicking a topic button manually

### API Not Working
1. Check `.env` file exists in project root
2. Verify API key format: `REACT_APP_OPENAI_KEY=sk-proj-...`
3. Restart app after adding/changing .env
4. Check OpenAI account has credits
5. App works perfectly with fallback content!

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env` | API key (gitignored) |
| `src/App.js` | Main routing |
| `src/components/FaceTracker.jsx` | Core tracking logic |
| `src/components/EducationEngine.jsx` | AI integration |
| `src/components/MorphTargetAvatar.jsx` | 3D avatar |
| `docs/SPRINT5_COMPLETE.md` | Full documentation |
| `docs/PROJECT_STATUS.md` | Project overview |

## 💡 Tips & Tricks

### Best Performance
- Good lighting (face window or lamp)
- 50-70cm from camera
- Eye level screen positioning
- Stable internet for avatar

### Best Experience (PRT Mode)
- Start tracking first
- Let score build up
- Try different topics
- Listen to full responses
- Watch conversation history

### Development
- Use Chrome DevTools for debugging
- Check console for AI status messages
- Monitor network tab for API calls
- Use React DevTools for state inspection

## 📞 Getting Help

### Check Documentation
1. `docs/SPRINT5_COMPLETE.md` - Comprehensive guide
2. `docs/PROJECT_STATUS.md` - Project status
3. `docs/QUICK_REFERENCE.md` - This file

### Common Questions
- **"Why orange badge?"** → No API key, using fallback (works great!)
- **"Why no education in other modes?"** → By design (PRT only)
- **"Can I use without internet?"** → No (avatar requires online)
- **"Is my data private?"** → Yes (local processing only)

---

**Need more help?** Check the full documentation in `docs/SPRINT5_COMPLETE.md`
