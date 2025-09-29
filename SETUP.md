# 🚜 KrishiRakshak - VS Code Setup Guide

## Quick Setup Commands

### 1. Clone and Setup
```bash
# Clone the project (if not already done)
git clone <your-repo-url>
cd krishirakshak

# Install Node.js dependencies
npm install

# Install Python dependencies (for offline model)
pip3 install numpy pandas scikit-learn joblib earthengine-api
```

### 2. VS Code Extensions (Recommended)
```bash
# Install VS Code extensions via command line
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-python.python
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-json
```

### 3. Environment Setup
```bash
# Create .env file (optional - works without external services)
touch .env

# Add environment variables (optional):
# DATABASE_URL=postgresql://username:password@localhost:5432/krishirakshak
# TWILIO_ACCOUNT_SID=your_twilio_sid
# TWILIO_AUTH_TOKEN=your_twilio_token
# TWILIO_PHONE_NUMBER=your_twilio_phone
```

### 4. Run the Application
```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start

# Database push (if using PostgreSQL)
npm run db:push
```

## 🛠️ VS Code Configuration

### settings.json (Workspace)
Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### launch.json (Debugging)
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.ts",
      "runtimeArgs": ["-r", "tsx/cjs"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

## 📁 Project Structure
```
krishirakshak/
├── client/src/           # React frontend
├── server/              # Express backend
├── data/               # CSV training data
├── shared/             # Shared types/schemas
├── package.json        # Dependencies
└── vite.config.ts      # Build configuration
```

## 🚀 Quick Test Commands
```bash
# Test user registration
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Farmer", "mobile": "9876543210", "preferredLanguage": "en"}'

# Test crop analysis
curl -X POST http://localhost:5000/api/offline-analysis \
  -H "Content-Type: application/json" \
  -d '{"latitude": 18.0074, "longitude": 79.5941, "cropType": "rice", "fieldArea": 2.5, "mobile": "9876543210", "language": "en"}'
```

## 🔧 Troubleshooting

### Common Issues:
1. **"Mobile number not registered"** → Register user first with `/api/users`
2. **Python errors** → Install: `pip3 install numpy pandas scikit-learn`
3. **Port conflicts** → Application runs on port 5000
4. **Database errors** → System uses memory storage by default (no DB required)

### System Requirements:
- Node.js 18+ 
- Python 3.8+
- VS Code 1.70+
- 4GB RAM minimum
- 1GB free disk space