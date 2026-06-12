# 🏗️ Architecture Blueprint — SpendWise 3.0

SpendWise 3.0 is built on a **Unified Neural Architecture**, designed for high-performance fintech operations and enterprise scalability.

## 1. The Neural Stack
-   **Orchestration**: Google Genkit v1.0 handles the flow of data between the user, the database, and the LLM.
-   **Intelligence**: Gemini 2.5 Flash provides multi-modal vision (OCR), natural language understanding (Voice Intent), and temporal reasoning (Forecasting).
-   **RAG Pipeline**: Real-time Retrieval Augmented Generation fetches user transaction history from Firestore to provide contextual financial advice.

## 2. Data Persistence (The Matrix)
-   **Database**: Google Cloud Firestore (NoSQL) with a sub-collection hierarchy:
    -   `/users/{uid}`: Global user identity and profile metadata.
    -   `/users/{uid}/transactions`: High-throughput ledger history.
    -   `/users/{uid}/budgets`: Sector-wise resource limits.
    -   `/users/{uid}/goals`: Strategic manifestation targets.
-   **Security**: Granular Firestore Security Rules ensure that users can only access their own neural logs.

## 3. Command Interface (Frontend)
-   **Framework**: Next.js 15 App Router (Turbopack).
-   **State Management**: React 19 hooks and optimized Firebase listeners for real-time reactivity.
-   **Design System**: "Fintech Noir" — a specialized UI library using Tailwind CSS and Framer Motion for high-density information display and hardware-accelerated animations.

## 4. Performance Optimizations
-   **Server Actions**: All AI calls are wrapped in `'use server'` actions to protect API keys and reduce client-side bundle size.
-   **Optimistic Updates**: Using Firebase's offline persistence for instant UI feedback even on low-latency networks.
-   **Lazy Loading**: Feature-based code splitting ensures a fast First Contentful Paint (FCP).

## 5. Deployment Matrix
-   **Platform**: Firebase App Hosting with global CDN edge caching.
-   **CI/CD**: GitHub Actions integrated for automatic deployments and preview channels.
