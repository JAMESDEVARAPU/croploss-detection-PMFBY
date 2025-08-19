# KrishiRakshak: Hybrid XAI-Powered Claim Eligibility System

## Overview

KrishiRakshak is a hybrid XAI-powered claim eligibility system that helps farmers understand crop loss decisions through explainable AI. The platform detects crop loss using NDVI satellite data and weather patterns, predicts damage extent using local ML models (offline capability), uses SHAP for transparent decision explanations in local languages, checks PMFBY guidelines locally, and supports voice input/output in Hindi and Telugu. The system provides clear, understandable explanations for claim approvals or rejections.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Component-based UI using React 18 with TypeScript for type safety
- **Tailwind CSS + shadcn/ui**: Utility-first CSS framework with a comprehensive component library
- **Vite**: Fast build tool with hot module replacement for development
- **React Query**: Server state management for API calls and caching
- **Wouter**: Lightweight client-side routing
- **Multi-language Support**: Internationalization system supporting English, Hindi, and Telugu

### Backend Architecture
- **Express.js with TypeScript**: RESTful API server with type safety
- **In-Memory Storage**: Simple storage implementation with interfaces for easy database migration
- **Service Layer**: Modular services for PMFBY rules, SMS notifications, and satellite analysis
- **Python Integration**: Google Earth Engine integration for satellite imagery analysis
- **Form Validation**: Zod schema validation for API requests

### Database Design
- **PostgreSQL Schema**: Uses Drizzle ORM with PostgreSQL dialect
- **Core Tables**:
  - Users (mobile, language preferences)
  - Crop Analyses (coordinates, analysis results, PMFBY eligibility)
  - PMFBY Rules (crop-specific compensation parameters)
- **Schema Validation**: Drizzle-Zod integration for runtime type checking

### Authentication & Authorization
- **Session-based**: Simple session management without complex authentication
- **Mobile-based Identification**: Users identified by mobile number for SMS delivery

### API Architecture
- **RESTful Design**: Standard REST endpoints for users and crop analyses
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Request Logging**: Comprehensive logging for API requests and responses

## External Dependencies

### Cloud Services
- **Google Earth Engine**: Satellite imagery analysis using Sentinel-2 data for NDVI calculations and crop loss detection
- **Neon Database**: PostgreSQL hosting (configured via DATABASE_URL)
- **Twilio SMS**: SMS notification service for sending analysis results

### Development Tools
- **Replit Integration**: Development environment with runtime error overlay and cartographer plugins
- **ESBuild**: Production bundling for server-side code
- **Drizzle Kit**: Database migration and schema management

### UI Components
- **Radix UI**: Headless component primitives for accessibility
- **Lucide Icons**: Icon library for consistent visual elements
- **Embla Carousel**: Image carousel for satellite imagery display

### Satellite Analysis
- **Python Runtime**: Earth Engine Python API for satellite data processing with fallback simulation
- **NDVI Calculation**: Normalized Difference Vegetation Index for crop health assessment  
- **Temporal Analysis**: 1-2 month gap between before/after satellite imagery for accurate change detection
- **Cloud Filtering**: Sentinel-2 imagery with cloud masking for accurate analysis
- **Image Acquisition**: Timestamps stored for before/after satellite images with visual display
- **Simulation Mode**: Realistic demo mode when Google Earth Engine credentials unavailable

### SMS Service
- **Template System**: Multi-language SMS templates with variable substitution
- **Fallback Simulation**: Development mode SMS simulation when credentials unavailable
- **Status Tracking**: SMS delivery status monitoring