# Production Deployment Blueprint

SpendWise 3.0 is optimized for global scalability using Firebase App Hosting and the Google Cloud ecosystem.

## 🚀 Deployment Pipeline

### 1. Environment Configuration
Ensure the following variables are established in your production environment:
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Production Auth key.
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Cloud project identifier.
- `GOOGLE_GENAI_API_KEY`: API access for Gemini 2.5 Flash.

### 2. Build & Optimization
- Run `npm run build` to generate the production matrix.
- Next.js 15 handles automatic static optimization and route pre-fetching.
- Images are optimized via `next/image` with Unsplash and Picsum remote patterns.

### 3. Database Migration
- Firestore Security Rules are automatically applied via the SpendWise file watcher.
- Indexes should be created for `date` and `category` fields in the `transactions` collection.

### 4. Continuous Integration
- Integrated with GitHub Actions via Firebase App Hosting.
- Automatic rollbacks and preview channels for feature testing.

## 🛡️ Security Posture
- **Zero-Trust Identity**: Anonymous/Simple identity portal creates distinct Firestore isolation.
- **Sanitized AI Prompts**: Genkit schemas ensure all LLM outputs match strict Zod definitions.
- **Encrypted Logs**: All transaction metadata is encrypted at rest within Google Cloud.
