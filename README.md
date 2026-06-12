# 💰 SpendWise 3.0 — AI-Powered Financial Intelligence

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Genkit AI](https://img.shields.io/badge/Genkit-1.0-blue?style=for-the-badge&logo=google-cloud)](https://firebase.google.com/docs/genkit)
[![Firebase](https://img.shields.io/badge/Firebase-BaaS-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

SpendWise is a production-grade, AI-driven personal finance ecosystem designed for the modern professional. Moving beyond traditional "ledger-only" apps, SpendWise 3.0 introduces a **Neural Financial Terminal** that acts as a proactive co-pilot for your wealth, job market standing, and long-term financial health.

---

## 🚀 The Vision
In an era of fragmented digital spending, SpendWise centralizes your financial matrix. It leverages **Gemini 2.5 Flash** to analyze spending DNA, predict future cash flow, and correlate personal habits with professional stability. Our design philosophy, **"Fintech Noir,"** combines high-contrast glassmorphism with physics-based interactions to provide an elite command-center experience.

## 🧠 Core Intelligence Modules

### 1. AI Financial Twin (Copilot)
*   **Contextual RAG**: Retrieves your entire transaction history, budgets, and goals to provide holistic advice.
*   **Job Market Correlation**: Analyzes how your spending affects your "Professional Burn Rate" and market readiness.
*   **Voice & Vision**: Log expenses via natural language ("Spent 500 on dinner") or by uploading receipt photos for OCR extraction.

### 2. Quantum Pulse (Analytics)
*   **Predictive Forecasting**: AI-driven projections of account balances for 7, 30, and 90-day windows.
*   **Subscription Intelligence**: Automatically detects recurring "leaks" and calculates annual projected losses.
*   **Neural Distribution**: Interactive Recharts visualizations of sector-wise outflows and efficiency metrics.

### 3. Strategic Control (Budgets & Goals)
*   **Sector Limits**: Category-wise budget enforcement with real-time "Danger Zone" notifications.
*   **Manifestation Goals**: Track high-value acquisitions with smart-saving progress bars.
*   **Temporal Alerts**: A bill reminder system for EMI, Rent, and Utilities.

---

## 🏗️ System Architecture

SpendWise 3.0 follows a **Modular Neural Architecture**:

-   **Frontend**: Next.js 15 (App Router) with React 19 for high-performance server-side rendering and client interactivity.
-   **AI Layer**: Google Genkit v1.0 orchestrating Gemini 2.5 Flash for RAG, OCR, and predictive modeling.
-   **Backend**: Firebase (Auth & Firestore) providing a real-time, zero-trust data matrix.
-   **Visuals**: Framer Motion for micro-interactions and Recharts for quantum data visualization.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15, TypeScript |
| **AI Engine** | Genkit, Gemini 2.5 Flash (Multi-modal) |
| **Backend** | Firebase Auth, Cloud Firestore |
| **Styling** | Tailwind CSS 3.4, ShadCN UI, Lucide Icons |
| **Animation** | Framer Motion 12.0 |
| **Data Viz** | Recharts 2.x |

---

## 📂 Folder Structure

```bash
src/
├── ai/                  # Genkit flows (Categorization, Analysis, RAG)
├── app/                 # Next.js 15 App Router pages (Feature-based)
├── components/          # Reusable UI (Atomic Design)
├── firebase/            # SDK configuration & Specialized hooks
├── hooks/               # Custom React hooks for business logic
├── lib/                 # Shared utilities and types
└── services/            # Domain-specific logic
```

---

## ⚡ Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-username/spendwise-3.0.git
   cd spendwise-3.0
   npm install
   ```

2. **Environment Configuration**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id
   GOOGLE_GENAI_API_KEY=your_gemini_key
   ```

3. **Launch Terminal**
   ```bash
   npm run dev
   ```

---

## 📜 Documentation
- [Problem Statement](problem.md)
- [Architecture Blueprint](docs/ARCHITECTURE.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

## 👨‍💻 Author
**SpendWise Core Team**
*Specializing in AI-Driven Fintech Solutions.*

## ⚖️ License
This project is licensed under the MIT License.
