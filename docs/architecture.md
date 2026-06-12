# SpendWise 3.0 — AI Neural Architecture

SpendWise 3.0 is built on a "Unified Neural Platform" architecture, leveraging the high-performance Next.js 15 App Router and the Genkit AI framework.

## 🏗️ System Components

### 1. The Neural Layer (Genkit + Gemini 2.5 Flash)
- **Flow-Based Intelligence**: Every AI feature (Forecasting, Health Scoring, DNA Analysis) is implemented as a Genkit Flow.
- **Multi-Modal Vision**: Gemini 2.5 Flash handles complex receipt OCR directly, eliminating the need for legacy Tesseract/OpenCV pipelines.
- **Contextual RAG**: The AI fetches real-time Firestore data to provide context-aware financial advice.

### 2. The Data Matrix (Firestore)
- **Universal Ledger**: A sub-collection model (`/users/{uid}/transactions`) designed for high-throughput logging.
- **Identity Records**: Global user profiles containing gamification stats and authority ranks.
- **Security Rules**: Granular, owner-only access patterns enforced at the database level.

### 3. The Command Interface (Next.js 15)
- **Fintech Noir UI**: A specialized design system using Tailwind and Framer Motion for a "glassmorphism" aesthetic.
- **Server Actions**: All AI calls are wrapped in `'use server'` actions for security and performance.
- **Client-Side SDKs**: Direct Firestore listeners for real-time dashboard updates without polling.

## 📊 Technical Stack Matrix
- **Framework**: Next.js 15 (Turbopack)
- **AI Framework**: Google Genkit v1.0
- **Primary LLM**: Gemini 2.5 Flash
- **Backend-as-a-Service**: Firebase (Auth, Firestore)
- **Visualizations**: Recharts 2.x
- **Animation**: Framer Motion 12.0
