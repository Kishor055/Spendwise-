# 💰 SpendWise 2.0 — AI-Powered Fintech Ecosystem

SpendWise is a production-grade, AI-driven personal finance and expense management platform. Designed with a futuristic "Fintech Noir" aesthetic, it leverages advanced AI to provide deep financial insights, automated tracking, and strategic wealth planning.

---

## 🚀 Vision
SpendWise transforms traditional expense tracking into a **Neural Financial Terminal**. It doesn't just record transactions; it analyzes patterns, predicts trends, and coaches users toward financial freedom using the power of Generative AI.

---

## 🌟 Key Features

### 🧠 Neural Command Center (Dashboard)
- **Quantum Analytics**: Real-time visualization of Liquidity, Inflow, Outflow, and Burn Rate.
- **Financial Vitality Index**: A sophisticated health gauge that calculates saving efficiency.
- **Temporal Pulse**: Interactive Area charts for 7-day spending trends.

### 🤖 Nexus AI Assistant
- **AI Financial Advisor**: A specialized Genkit-powered agent for personalized wealth advice based on local spending habits.
- **Money Wrapped**: Viral-style social recaps of your monthly and yearly financial journey.
- **Strategic Prompting**: Pre-built commands for instant budget analysis and savings tips.

### 💳 Universal Transaction Engine
- **Multi-Sector Tracking**: Comprehensive categorization (Food, Shopping, Travel, EMI, etc.).
- **Evidence Logging**: Receipt upload capability and encrypted notes.
- **Universal History**: Searchable, filterable ledger with one-click CSV export.

### 🎯 Strategic Control (Budgets & Goals)
- **Sector Limits**: Category-wise budget enforcement with real-time overspending alerts.
- **Manifest Goals**: Target-based savings tracking for high-value acquisitions.
- **Recursive Bills**: A dedicated reminder system for Rent, EMI, and Utilities.

### 🔐 Security & Authority
- **Nexus Terminal (Admin)**: Global oversight for system entities and security status.
- **Encryption Protocol**: Secure Firebase-backed authentication (Google, Email, OTP).
- **Matrix Permissions**: Robust Firestore security rules ensuring total data privacy.

---

## 🎨 Design Philosophy: "Fintech Noir"
SpendWise uses **Glassmorphism 2.0/3.0** principles:
- **Depth & Translucency**: Layered interfaces with 20px+ blur.
- **High-Contrast Legibility**: Deep `#020617` backgrounds with vibrant neon accents.
- **Physics-Based UI**: Smooth, hardware-accelerated transitions via `framer-motion`.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS, ShadCN UI, Lucide Icons |
| **Animation** | Framer Motion, Tailwind Animate |
| **Backend** | Firebase (Auth, Firestore) |
| **AI Engine** | Genkit, Google Gemini 2.5 Flash |
| **Charts** | Recharts |

---

## 📂 Project Structure

```bash
src/
├── ai/                  # Genkit flows and AI prompt logic
├── app/                 # Next.js App Router (Pages & Layouts)
│   ├── (auth)/          # Authentication routes (Login, Register)
│   ├── dashboard/       # Main Command Center
│   ├── analytics/       # Data visualization hub
│   ├── budget/          # Sector limit management
│   └── ai-assistant/    # Nexus AI Terminal
├── components/          # Reusable UI & Complex Widgets
│   ├── ui/              # ShadCN base components
│   └── layout/          # Global navigation (Pill-nav)
├── firebase/            # Firebase SDK config & Non-blocking hooks
└── lib/                 # Shared utilities and types
```

---

## ⚡ Quick Start

### 1. Initialize Project
```bash
npm install
```

### 2. Set Up Environment
Create a `.env.local` file with your Firebase and Google AI credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id
GOOGLE_GENAI_API_KEY=your_gemini_key
```

### 3. Launch Nexus
```bash
npm run dev
```

---

## 👨‍💻 Author
**SpendWise Core Team**
*Specializing in AI-Driven Fintech Solutions.*

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
