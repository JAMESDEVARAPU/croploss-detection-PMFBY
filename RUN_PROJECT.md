# KrishiRakshak Project Workflow

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** database
3. **Python** (for ML models)
4. **Microphone access** (for wake word)

## Step-by-Step Workflow

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
```bash
# Start PostgreSQL service
# Create database and user as per .env file
npm run db:push
```

### 3. Environment Setup
Copy `.env.example` to `.env` and update with your actual keys:
```bash
cp .env.example .env
```

Then edit `.env` with your actual:
- Database URL
- OpenAI API Key  
- Picovoice Access Key
- Google Cloud credentials

### 4. Wake Word Model (Optional)
- Download `wakeword.ppn` from Picovoice
- Place in `server/` directory

### 5. Start Development Server
```bash
npm run dev
```

### 6. Access Application
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api

## Features Available

✅ **User Registration/Login**
✅ **Satellite Analysis** 
✅ **PMFBY Eligibility Check**
✅ **Voice Commands**
✅ **Wake Word Detection**
✅ **Multi-language Support**
✅ **Offline Analysis**

## Testing Wake Word

1. Open http://localhost:5000
2. Login with any mobile number
3. Click "Start" in Voice Assistant
4. Say "Hey KrishiRakshak"
5. Give command: "Check my crop health"

## API Endpoints

- `POST /api/wakeword/start` - Start wake word service
- `POST /api/wakeword/stop` - Stop wake word service  
- `GET /api/wakeword/status` - Get wake word status
- `POST /api/voice-command` - Process voice commands
- `POST /api/crop-analysis` - Analyze crop loss
- `POST /api/offline-analysis` - Offline analysis