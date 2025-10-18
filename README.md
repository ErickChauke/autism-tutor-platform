# AI Autism Tutoring Platform

Web-based eye contact training system for children with autism using AI, face tracking, and interactive avatars.

## 🚀 Quick Start
```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## 📋 Features

- **Real-time Face Tracking**: MediaPipe-based eye contact detection
- **Interactive Avatar**: 3D avatar with lip-sync and emotions
- **4 Training Modes**: Assessment, Prompting, PRT, Research
- **Educational Content**: Animals, Space, Colors, Numbers
- **Voice Reminders**: Attention prompts and encouragement
- **Privacy-First**: All processing happens locally

## 📁 Project Structure
```
autism-tutor-platform/
├── src/
│   ├── config/           # Configuration files
│   ├── components/       # React components
│   ├── utils/           # Utility functions
│   ├── styles/          # CSS files
│   └── assets/          # Images, fonts, etc.
├── docs/                # Documentation
├── public/              # Static files
└── tests/               # Test files
```

## 🎯 Modes

- **Assessment**: Baseline measurement (no intervention)
- **Prompting**: Visual cues guide attention
- **PRT**: Positive reinforcement training
- **Research**: Controlled data collection

## 🔧 Configuration

Edit `src/config/app-config.js` to change:
- Lip-sync timing
- Speech settings
- Eye contact thresholds
- Avatar behavior

## 📚 Documentation

- [Changelog](docs/CHANGELOG.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Project Status](docs/PROJECT_STATUS.md)

## 🧪 Technology Stack

- **Frontend**: React 18
- **Face Tracking**: MediaPipe Face Mesh
- **3D Rendering**: Three.js + React Three Fiber
- **Avatar**: Ready Player Me
- **Speech**: Web Speech API

## 📝 License

Educational project for autism intervention research.

## 👥 Team

- Erick + Innocent Mnguni
- Supervisor: Vered Ahronson
