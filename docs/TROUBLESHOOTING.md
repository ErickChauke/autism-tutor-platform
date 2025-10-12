# Troubleshooting Guide

## 🔊 Voice/Speech Issues

### No Voice Reminders When Looking Away

**Symptoms:**
- Face tracking works
- Look away but hear no prompts
- "Enable Voice Reminders" is checked

**Solutions:**

1. **Check Browser Console**
   ```javascript
   // Open DevTools (F12) → Console tab
   // Look for these messages:
   // ✅ "👁️ AttentionPrompter initialized"
   // ✅ "👁️ Focus lost, starting timer..."
   // ✅ "🔔 Prompting: [message]"
   ```

2. **Verify Mode**
   - Voice reminders only work in **Prompting Mode** and **PRT Mode**
   - Not available in Assessment or Research modes
   - Check mode badge at top of screen

3. **Test Speech System**
   ```javascript
   // In browser console:
   import { speechManager } from './utils/speech-manager.js';
   speechManager.speak('Testing voice');
   // Should hear "Testing voice"
   ```

4. **Check Timing**
   - Wait 4 seconds after looking away
   - Minimum 10 seconds between prompts
   - Won't prompt if already speaking

5. **Browser Audio Settings**
   - Check system volume is up
   - Check browser tab not muted
   - Try different browser (Chrome recommended)
   - Check browser allows audio autoplay

6. **Force Restart**
   - Stop tracking
   - Refresh page (F5)
   - Start tracking again
   - Look away and wait 4 seconds

### Educational Content Not Speaking

**Symptoms:**
- Click topic buttons but no voice
- Content appears but silent

**Solutions:**

1. **Check Speech Toggle**
   - Look for "🔊 Enable Educational Speech" checkbox
   - Must be checked for speech
   - Located below topic buttons

2. **Check if Speech is Busy**
   - Wait for current speech to finish
   - Only one voice at a time
   - Educational speech waits for attention prompts

3. **Test Direct Speech**
   ```javascript
   import { speechManager } from './utils/speech-manager.js';
   speechManager.speak('Education test');
   ```

### Voice Conflicts / Overlapping

**Symptoms:**
- Multiple voices talking at once
- Speech cuts off unexpectedly

**This should NOT happen** - SpeechManager prevents this.

**If it does:**
1. Check browser console for errors
2. Refresh page completely
3. Report issue (this is a bug)

## 📹 Face Tracking Issues

### Camera Not Starting

**Solutions:**
1. Grant camera permission
2. Close other apps using camera
3. Check camera works in other apps
4. Try different browser

### Face Not Detected

**Solutions:**
1. Improve lighting (face window/lamp)
2. Move 50-70cm from camera
3. Position screen at eye level
4. Check face not covered
5. Look directly at camera

### Eye Contact Not Registering

**Solutions:**
1. Look directly at center of screen
2. Adjust screen angle
3. Move closer/farther
4. Check good lighting on face

## 🤖 AI/OpenAI Issues

### Orange Badge (Fallback Content)

**This is NORMAL if:**
- No API key in .env file
- API key invalid/expired
- No internet connection
- API quota exceeded

**Fallback content works perfectly!**

**To enable AI:**
1. Create `.env` file in project root
2. Add: `REACT_APP_OPENAI_KEY=sk-proj-YOUR_KEY`
3. Restart: `npm start`

### AI Content Not Generating

**Solutions:**
1. Check green "🤖 AI Active" badge
2. Check internet connection
3. Verify API key valid
4. Check OpenAI account has credits
5. Look for errors in console

## 🎮 General Issues

### App Not Loading

1. Check terminal for errors
2. Run: `npm install`
3. Run: `npm start`
4. Clear browser cache
5. Try different browser

### Mode Not Switching

1. Click "← Back" button
2. Select different mode
3. Click "Start [Mode Name]"

### Score Not Increasing (PRT Mode)

1. Check mode badge says "PRT Mode"
2. Click "Start Tracking"
3. Make eye contact
4. Watch for gold eye dots
5. Score increases +10 per eye contact

## 🔧 Developer Issues

### React Errors in Console

**Common fixes:**
1. Delete `node_modules` folder
2. Run: `npm install`
3. Run: `npm start`

### Import Errors

Check file paths:
- `./utils/speech-manager` (correct)
- `utils/speech-manager` (wrong - missing ./)

### MediaPipe Not Loading

1. Check internet connection (CDN required)
2. Clear browser cache
3. Try incognito/private window

## 📋 Quick Diagnostic Checklist

Run through this checklist:

- [ ] Camera permission granted
- [ ] Tracking started (button says "Stop Tracking")
- [ ] Face detected (blue dots on eyes)
- [ ] Correct mode selected (check badge)
- [ ] Voice reminders checkbox checked (if applicable)
- [ ] Browser audio not muted
- [ ] System volume up
- [ ] No other app using camera
- [ ] Good lighting on face
- [ ] Looking directly at camera

## 🆘 Still Not Working?

1. **Check Browser Console** (F12 → Console)
   - Look for errors (red text)
   - Check for success messages (green checkmarks)

2. **Full Reset**
   ```bash
   # Stop app (Ctrl+C)
   rm -rf node_modules
   npm install
   npm start
   ```

3. **Try Different Browser**
   - Chrome (recommended)
   - Firefox
   - Edge

4. **Check Documentation**
   - `docs/SPRINT5_COMPLETE.md` - Full guide
   - `docs/QUICK_REFERENCE.md` - Quick start
   - `docs/PROJECT_STATUS.md` - Features list

## 🐛 Found a Bug?

If something's truly broken:
1. Note what you were doing
2. Check browser console for errors
3. Note your browser and OS
4. Try to reproduce the issue
5. Document steps to reproduce

---

**Most Common Issue:** Voice reminders need 4 seconds wait time and only work in Prompting/PRT modes!
