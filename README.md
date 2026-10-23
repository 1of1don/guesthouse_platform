# MiCasa SuCasa Guesthouse Platform — Admin Portal

A modern, boutique hospitality operations and administration platform for guesthouse inventory, reservation metrics, and manager controls in Botswana.

---

## 📁 Clean Folder Structure

```text
├── server.ts                  # Full-stack Express server (Gemini AI Concierge proxy & Vite middleware)
├── index.html                 # HTML application entry point
├── package.json               # Dependencies and scripts (dev, build, lint)
├── tsconfig.json              # TypeScript compilation config
├── vite.config.ts             # Vite build configuration
├── .env.example               # Environment variable templates
├── README.md                  # Quick project guide & folder layout overview
├── PROJECT_OVERVIEW_AND_EXPLANATION.md # Full architectural & beginner-friendly code walkthrough
├── BACKEND_AND_USER_GUIDE.md  # Detailed backend guide & step-by-step user manual
│
├── docs/                      # Reference materials & project documentation
│   └── reference-materials/   # Uploaded project specifications and briefs
│
├── public/                    # Production static web assets
│   ├── favicon.svg            # Browser tab icon
│   └── micasa.png             # Official MiCasa brand logo
│
└── src/                       # React frontend application source
    ├── types/                 # TypeScript blueprints & interfaces
    │   └── index.ts           # Guesthouse, AdminUser, DashboardStats types
    │
    ├── context/               # Global state providers and hooks
    │   ├── AuthContext.tsx    # Admin authentication session provider
    │   ├── auth-context.ts    # Auth context interfaces
    │   ├── useAuth.ts         # Convenience hook for useAuth()
    │   ├── SettingsContext.tsx# Currency (BWP/USD/ZAR/EUR/GBP) & Theme provider
    │   └── index.ts           # Clean barrel export for all contexts & hooks
    │
    ├── services/              # Data services & API controllers
    │   ├── api.ts             # CRUD operations (Firestore + LocalStorage fallback)
    │   └── index.ts           # Barrel export for api service
    │
    ├── components/            # Modular reusable UI components
    │   ├── layout/            # Layout wrappers and navigation
    │   │   ├── Header.tsx     # Top bar with breadcrumbs & conditional search
    │   │   ├── Sidebar.tsx    # Left navigation bar with admin profile
    │   │   ├── Layout.tsx     # Persistent layout frame
    │   │   ├── CommandMenu.tsx# Quick search modal (Ctrl+K / Cmd+K)
    │   │   └── index.ts       # Layout barrel export
    │   ├── ui/                # Core visual UI cards and modals
    │   │   ├── StatCard.tsx   # KPI metric card
    │   │   ├── PropertyCard.tsx # Guesthouse catalog card
    │   │   ├── PropertyDetailModal.tsx # Full dossier popup modal
    │   │   └── index.ts       # UI barrel export
    │   ├── chat/              # Chatbot interfaces
    │   │   ├── FloatingChatWidget.tsx # Floating quick concierge widget
    │   │   └── index.ts       # Chat barrel export
    │   └── index.ts           # Master components barrel export
    │
    ├── pages/                 # Route page views
    │   ├── Dashboard.tsx      # High-level overview & destination distribution
    │   ├── Guesthouses.tsx    # Searchable, filterable guesthouse catalog
    │   ├── AddEditGuesthouse.tsx # Guesthouse registration & modification form
    │   ├── AdminUsers.tsx     # Team administrator governance
    │   ├── Settings.tsx       # Currency converter & theme preferences
    │   ├── Assistant.tsx      # Dedicated AI Concierge chat (Gemini models)
    │   ├── Login.tsx          # Admin sign-in screen (with 1-click Demo Admin)
    │   ├── Signup.tsx         # Admin governance & credentials access info
    │   └── index.ts           # Pages barrel export
    │
    ├── firebase.ts            # Firebase SDK client initialization
    ├── App.tsx                # React Router setup & protected routes
    ├── main.tsx               # React DOM root entry point
    └── index.css              # Global Tailwind CSS styles and glassmorphic utilities
```

---

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Runs on `http://localhost:3000`.

3. **Build for Production**:
   ```bash
   npm run build
   ```

4. **Verify TypeScript & Linting**:
   ```bash
   npm run lint
   ```

---

## 📖 In-Depth Guides

- **`PROJECT_OVERVIEW_AND_EXPLANATION.md`**: Explains how every single block of code works, line-by-line concept breakdown, and a 3-minute oral presentation guide.
- **`BACKEND_AND_USER_GUIDE.md`**: Explains the hybrid Firestore/LocalStorage database schema, the Gemini AI `/api/chat` route, and step-by-step instructions for every page.
