# Overview

KrishiRakshak is an agricultural crop loss detection and PMFBY (Pradhan Mantri Fasal Bima Yojana) eligibility assessment system designed for Indian farmers. The application provides offline-capable crop health analysis using satellite imagery, machine learning models, and multi-language voice assistance. It supports English, Hindi, and Telugu to serve farmers across different regions of India.

The system analyzes crop loss through NDVI (Normalized Difference Vegetation Index) analysis, weather data correlation, and coordinate-based predictions. It determines PMFBY compensation eligibility and provides farmer-friendly explanations in local languages. The application works both online (with satellite data) and offline (using pre-trained ML models and CSV datasets).

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool

**UI Components**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling

**State Management**: TanStack React Query for server state management, React hooks for local state

**Routing**: Wouter for lightweight client-side routing

**Key Design Patterns**:
- Component-based architecture with reusable UI components
- Custom hooks for cross-cutting concerns (language, wake word detection)
- Context providers for global state (LanguageProvider, WakeWordProvider)
- Progressive Web App (PWA) capabilities with service worker support for offline functionality

**Voice Interface**: Integration with browser Speech Recognition API and custom wake word detection using Picovoice

## Backend Architecture

**Runtime**: Node.js with Express.js server framework

**Language**: TypeScript compiled to ESM modules

**API Design**: RESTful endpoints for user management, crop analysis, and PMFBY rules

**Key Services**:
- **Satellite Analysis**: Python-based Google Earth Engine integration for NDVI calculations and satellite imagery retrieval
- **ML Prediction**: Offline crop loss prediction using scikit-learn Random Forest models trained on CSV agricultural data
- **Voice Processing**: Multi-language speech-to-text and text-to-speech capabilities
- **SMS Notifications**: Twilio integration for farmer notifications in local languages
- **Geocoding**: Google Maps API for location information extraction
- **XAI (Explainable AI)**: Feature importance analysis with farmer-friendly explanations

**ML Pipeline**:
- Training pipeline (`offline-crop-trainer.py`) processes CSV data with NDVI, weather, and location features
- Prediction service (`offline-predictor.py`) uses trained models for coordinate-based loss estimation
- Feature engineering includes weather stress indicators, temporal features, and spatial encoding
- Models stored as joblib pickles with metadata for versioning

## Data Storage

**Primary Database**: PostgreSQL with Drizzle ORM

**Schema Design**:
- `users` table: Farmer profiles with mobile, location, and language preferences
- `crop_analyses` table: Analysis results with NDVI data, loss percentages, PMFBY eligibility, and satellite images
- `sessions` table: Express session management
- `pmfby_rules` table: Crop-specific compensation rules and thresholds

**Alternative Storage**: File-based CSV datasets for offline operation in `data/` directory

**Offline Data**: 
- Training datasets stored as CSV files with location, NDVI, weather, and crop data
- Pre-trained models stored as `.pkl` files with companion metadata JSON
- Satellite image caching for offline access

## Authentication & Authorization

**Current Implementation**: Simple user registration and login system with local storage persistence

**User Identification**: Mobile number as primary identifier for farmers

**Session Management**: Express sessions with PostgreSQL storage

## External Dependencies

### Third-Party APIs

1. **Google Earth Engine** (Optional)
   - Purpose: Satellite imagery and NDVI calculation
   - Fallback: CSV-based offline analysis
   - Authentication: Service account credentials

2. **Google Maps Geocoding API** (Optional)
   - Purpose: Reverse geocoding for location names
   - Used for: Village, Mandal, District, State extraction from coordinates

3. **Picovoice** (Optional)
   - Purpose: Wake word detection for voice interface
   - Requires: Access key and `.ppn` wake word model file

4. **Twilio** (Optional)
   - Purpose: SMS notifications to farmers
   - Fallback: Console logging when credentials unavailable

5. **OpenAI/Anthropic** (Optional)
   - Purpose: Enhanced natural language processing
   - Used for: Advanced voice command interpretation

### Python Dependencies

- **NumPy & Pandas**: Data processing and CSV handling
- **scikit-learn**: ML model training and prediction
- **joblib**: Model serialization
- **earthengine-api**: Google Earth Engine Python client (optional)

### JavaScript/TypeScript Dependencies

- **TensorFlow.js**: Browser-based ML inference (optional alternative to Python)
- **@picovoice/porcupine-web**: Browser wake word detection
- **Drizzle ORM**: Type-safe database queries
- **React Query**: Server state caching and synchronization

### Development Tools

- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first styling
- **Drizzle Kit**: Database migrations

### Environment Variables Required

**Core Functionality**:
- `DATABASE_URL`: PostgreSQL connection string (optional - app works without DB)

**Optional Services**:
- `GOOGLE_MAPS_API_KEY`: Geocoding service
- `GOOGLE_EARTH_ENGINE_SERVICE_ACCOUNT_EMAIL`: GEE authentication
- `GOOGLE_EARTH_ENGINE_PRIVATE_KEY`: GEE credentials
- `PICOVOICE_KEY`: Wake word detection
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`: SMS service
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`: Advanced NLP

**Degraded Mode**: Application functions with reduced capabilities when external services are unavailable, using offline ML models and CSV datasets.