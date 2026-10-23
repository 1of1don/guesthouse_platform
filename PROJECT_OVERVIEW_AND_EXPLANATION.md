# MiCasa SuCasa Admin Portal — Project Overview & Code Explanation

Welcome to the **MiCasa SuCasa Guesthouse Platform Admin Portal**! This document explains the current state of the application, how the frontend and backend work together, and how the code is structured in a clear, straightforward beginner/intermediate-friendly style.

---

## 1. What is this Web App?

**MiCasa SuCasa** is a hospitality discovery and management platform for boutique guesthouses and lodges in Botswana (Gaborone, Maun, Kasane, Palapye, Francistown, Ghanzi). 

While customers discover and explore rooms on their mobile app, **this web app is the Admin Portal** used by platform managers to:
1. **View Overview Metrics**: Total registered guesthouses, top destination city, average nightly prices, and recent additions.
2. **Manage Guesthouse Catalog**: Search, filter by city, sort by price/rating, view full dossiers, and delete properties.
3. **Register & Edit Guesthouses**: Fill in names, cities, GPS coordinates for Google Maps, amenities, descriptions, nightly tariffs, logos, and gallery photos.
4. **Manage Admin Users**: Maintain the single active administrator (**Ontiretse Bagwasi**), with the ability to invite more team members during a demo.
5. **Adjust Platform Settings**: Switch currencies (Botswana Pula `BWP`, `USD`, `ZAR`, `EUR`, `GBP`) formatted strictly to 2 decimal places, and toggle between Light Cream, Dark Espresso, and System themes.

---

## 2. Technology Stack & Design Theme

We kept the technology stack very clean, standard, and easy to explain:

- **React 18 & Vite**: Standard Single Page Application (SPA) using standard React functional components and hooks (`useState`, `useEffect`, `useContext`, `useParams`, `useNavigate`).
- **TypeScript**: Provides clear type safety and autocomplete using interfaces defined in `src/types/index.ts`.
- **Tailwind CSS**: Utility-first CSS styling.
- **Lucide React Icons**: Clean, modern icons for maps, buildings, currency, search, and user accounts.
- **Firebase & Browser LocalStorage**: Hybrid backend with live Firestore support plus automatic browser localStorage persistence so the app never fails offline or during a live demonstration.

### Modern UI Theme & Glassmorphism Design
The admin portal uses a clean, modern aesthetic with frosted glass surfaces and refined typography:
- **Canvas / Background**: Light Warm Alabaster (`#F8F6F2`) with subtle radial ambient light sheens; deep obsidian charcoal (`#0E0C0A`) in dark mode.
- **Glassmorphic Surfaces (`glass-panel`, `glass-card`)**: High-translucency frosted glass (`backdrop-blur-xl`, `bg-white/75`, delicate hairline borders `border-white/80` or `border-black/[0.06]`).
- **Sophisticated Accents**: Warm bronze and sand gold (`#9E7246`, `#B58752`, `#D6A670`) paired with deep espresso typography (`#231A14`).
- **Refined Typography**: `Plus Jakarta Sans` for clean, contemporary headings and labels, paired with `JetBrains Mono` for tabular numerals (`tabular-nums`) across all prices, coordinates, dates, and metrics. Unboxed quiet metadata with dot separators (`·`).

---

## 3. Project File Structure Explained

Here is how the project files are organized in `src/`:

```text
├── server.ts                  # Full-stack Express server proxying Gemini AI with system rules
src/
├── types/
│   └── index.ts               # Blueprints for Guesthouse, AdminUser, and DashboardStats
├── services/
│   └── api.ts                 # Backend data service (CRUD operations, calculations, seed data)
├── firebase.ts                # Firebase App, Firestore, and Storage initialization
├── context/
│   ├── AuthContext.tsx        # Manages login state, demo login, and logout
│   ├── auth-context.ts        # TypeScript interface for AuthContext
│   ├── useAuth.ts             # Custom hook to easily call useAuth()
│   └── SettingsContext.tsx    # Manages active currency and dark/light theme
├── components/
│   ├── layout/
│   │   ├── Header.tsx         # Top bar with breadcrumbs, action button & conditional search
│   │   ├── Sidebar.tsx        # Left navigation bar with Ontiretse Bagwasi's profile & menu
│   │   ├── Layout.tsx         # Wraps sidebar, header & floating chat around every admin page
│   │   └── CommandMenu.tsx    # Quick search modal triggered by Ctrl+K / Cmd+K
│   ├── chat/
│   │   └── FloatingChatWidget.tsx # Omnipresent floating concierge widget across all pages
│   └── ui/
│       ├── StatCard.tsx       # Reusable card component for dashboard KPIs
│       ├── PropertyCard.tsx   # Card component displaying a guesthouse in grid view
│       └── PropertyDetailModal.tsx # Full popup dossier showing photos, map, amenities
├── pages/
│   ├── Dashboard.tsx          # Main overview dashboard with stats and featured listings
│   ├── Guesthouses.tsx        # Catalog table/grid with search, city filter, and sorting
│   ├── AddEditGuesthouse.tsx  # Form to register new guesthouse or edit existing one
│   ├── Assistant.tsx          # AI Concierge with model routing, history & out-of-scope banner
│   ├── AdminUsers.tsx         # Team management page with Ontiretse Bagwasi and Add Admin modal
│   ├── Settings.tsx           # Currency selector (BWP/USD/ZAR/etc.) and Light/Dark theme toggle
│   ├── Login.tsx              # Admin sign-in screen with 1-click Demo Admin access
│   └── Signup.tsx             # Information on admin governance and access protocols
├── App.tsx                    # React Router configuration protecting routes
├── main.tsx                   # React root entry point
└── index.css                  # Global Tailwind CSS and color variables
```

---

## 4. How the Frontend Works (Step-by-Step)

### A. Routing & Protected Pages (`App.tsx`)
1. We use **React Router** (`react-router-dom`).
2. When a user visits the website:
   - If they are **not logged in**, any attempt to view `/dashboard`, `/guesthouses`, `/admins`, or `/settings` immediately redirects them to `/login`.
   - If they are **logged in**, navigating to `/` or `/login` automatically redirects them straight to `/dashboard`.
3. The `<Layout />` component wraps all protected pages so the Sidebar and Header stay consistent across the entire app.

### B. Header & Conditional Search Bar (`Header.tsx`)
- Contains breadcrumbs (e.g., `Admin · Dashboard Overview`).
- Contains the "Add Guesthouse" button.
- **Conditional Search**: We check `location.pathname === '/dashboard' || location.pathname === '/guesthouses'`. The search bar **only appears** on those two pages, keeping other pages clean.

### C. Sidebar Navigation & Admin Profile (`Sidebar.tsx`)
- Displays the MiCasa SuCasa brand logo.
- Navigation links to Dashboard, Guesthouses, Admins, and Settings.
- Shows the current total guesthouse count badge.
- Bottom user profile card displays **Ontiretse Bagwasi** (`onty@micasa.com`) with an **"OB"** avatar badge and a quick Logout button.

### D. Global State (`AuthContext.tsx` & `SettingsContext.tsx`)
- **Authentication**: Stores whether the user is logged in. Provides a `loginAsDemoAdmin()` function so you can sign in with 1 click during presentations without typing passwords.
- **Settings**: Stores the selected currency (defaults to Botswana Pula `BWP`) and theme (`light`, `dark`, `system`). Provides a helper function `formatPrice(amount)` that automatically converts and formats any price strictly to 2 decimal places (e.g. `P 920.00`).

---

## 5. How the Pages Work

### 1. Dashboard (`src/pages/Dashboard.tsx`)
- When the page loads, `useEffect()` calls `api.getDashboardStats()`.
- Renders 4 KPI cards:
  1. **Total Registered Guesthouses**
  2. **Top Destination City** (e.g., Gaborone)
  3. **Highest Rated Guesthouse** (shows "—" and "Awaiting mobile app ratings" until mobile users rate)
  4. **Added This Month & Average Price** (formatted to 2 decimal places)
- Features a **City Filter Tab Bar** (`All Cities`, `Gaborone`, `Maun`, `Kasane`, etc.) to quickly see listings by region.
- Clicking the eye icon opens the **Property Dossier Modal**; clicking Edit navigates to `/guesthouses/:id/edit`.

### 2. Guesthouses Catalog (`src/pages/Guesthouses.tsx`)
- Displays all properties with a **Grid View** (cards) and **Table View** toggle.
- **Instant Search Bar**: Filters in real-time by guesthouse name, city, description, or amenities.
- **City Dropdown Filter**: Quickly filter by any Botswana city.
- **Sort By**: Price Low to High, Price High to Low, Highest Rated, or Recently Registered.
- **Delete Action**: Clicking the red trash can prompts a standard confirmation dialog before deleting.

### 3. Register & Edit Guesthouse (`src/pages/AddEditGuesthouse.tsx`)
- Used for both adding a new guesthouse (`/guesthouses/new`) and editing (`/guesthouses/:id/edit`).
- **City Presets**: When you pick a city like Kasane or Maun, standard Botswana GPS coordinates are automatically filled in.
- **Amenities**: Toggle popular amenities like Free Wi-Fi, Pool, Air Conditioning, or type a custom one.
- **Photo Upload**: Supports uploading a main logo cover and multiple gallery photos.
- **Live Preview Sidebar**: As you type the name, city, price, and description, a live preview card updates in real-time on the right side!

### 4. AI Concierge & Chatbot (`src/pages/Assistant.tsx` & `src/components/chat/FloatingChatWidget.tsx`)
- Powered by Google Gemini through our server-side API (`/api/chat` in `server.ts`).
- **Dynamic Model Routing**:
  - **Gemini 3.8 Flash** (`gemini-3.8-flash`): Balanced, recommended default for all Botswana travel, lodging recommendations, and portal navigation.
  - **Gemini 3.1 Flash Lite** (`gemini-3.1-flash-lite`): Ultra-low latency model for quick single-turn questions or status checks.
  - **Gemini 4 Argon** (`gemini-4-argon`): Deep reasoning model for complex itinerary planning and multi-city safari lodge strategies.
- **Strict Out-of-Scope Guardrails**:
  - If a user asks the assistant to perform something outside its capabilities (such as altering the database directly, charging credit cards, booking outside Botswana, or deleting administrators), the bot **explicitly and politely informs the user that the action is out of scope**, explains why, and guides them to the proper portal page or to Primary Admin Ontiretse Bagwasi (`onty@micasa.com`).
- **Scrollable Conversation Thread**: Preserves user and model message history across turns with timestamps, role tags, and 1-click text copying.
- **Floating Quick Concierge**: Accessible via the circular bronze sparkle button in the bottom-right of every admin page.

### 5. Admin Users (`src/pages/AdminUsers.tsx`)
- Displays the team administrator accounts.
- By default, has exactly one administrator: **Ontiretse Bagwasi** (`onty@micasa.com`) with role **Owner**.
- Clicking **"Add Admin User"** opens a popup modal where you can enter a colleague's name, email, and role (`Admin` or `Owner`) to demonstrate team management live.

### 6. Settings (`src/pages/Settings.tsx`)
- **Currency Selection**: Switch between BWP, USD, ZAR, EUR, and GBP. All calculations update instantly across the entire platform.
- **Theme Selection**: Switch between Light Cream Theme, Dark Espresso Theme, or System Synchronized.
- Displays a quick green checkmark notice (`Preferences saved`) when updated.

---

## 6. How the Backend Works (`src/services/api.ts`)

The backend is built around a clean, single service file (`src/services/api.ts`).

### The Hybrid Storage Strategy:
1. **Firebase Firestore (Primary)**:
   - If your Firebase project credentials are provided in `.env` (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, etc.), it automatically reads and writes directly to the `guesthouses` and `admins` Firestore collections and uploads images to Firebase Storage.
2. **LocalStorage (Fallback & Instant Demo Mode)**:
   - If Firebase credentials are not yet configured or if you are presenting offline, the app persists all changes inside browser `localStorage` (`micasa_guesthouses_v7`).
   - The catalog starts completely empty with 0 mock guesthouses: every single guesthouse entry comes directly from registering a property on the **Add Guesthouse** page (`/guesthouses/new`).
   - **Why this is awesome**: You can add, edit, or delete guesthouses live during your presentation, and your changes will remain saved even when you refresh the browser!

---

## 7. How to Explain This in a Code Walkthrough / Demo

When presenting the code to an evaluator or teacher, follow this simple 3-minute explanation:

1. **Start at `App.tsx`**:
   *"We use React Router to define our pages. Notice how the routes are protected: visitors must be logged in to access the Dashboard or Guesthouse inventory."*
2. **Show `src/services/api.ts`**:
   *"Our backend API controller is located in `api.ts`. It provides functions like `getDashboardStats`, `getGuesthouses`, and `createGuesthouse`. It uses a hybrid approach: if Firebase is connected, it syncs with Firestore; otherwise, it uses LocalStorage so our app is 100% reliable during demonstrations."*
3. **Show `SettingsContext.tsx`**:
   *"Here we manage global preferences. Notice how all prices are converted based on the active currency and formatted strictly to 2 decimal places using `Intl.NumberFormat`."*
4. **Show `AddEditGuesthouse.tsx`**:
   *"In our Add/Edit form, choosing a Botswana city automatically populates Google Maps coordinates. Admins can toggle amenities, upload multiple photos, and see an auto-updating live card preview as they type."*
5. **Show `AdminUsers.tsx`**:
   *"Our administration page currently maintains one authorized administrator: Ontiretse Bagwasi. During this showcase, we can also use the 'Add Admin User' button to invite additional team members."*
6. **Show `Assistant.tsx` (AI Concierge & Out-of-Scope Protection)**:
   *"We also have an integrated Gemini AI Concierge. It supports model routing (`gemini-3.8-flash` for general tasks, `gemini-3.1-flash-lite` for speed, and `gemini-4-argon` for deep reasoning). Crucially, it has built-in out-of-scope guardrails: if a user asks it to alter the database, process credit cards, or query non-hospitality topics, the bot explains that it cannot perform that action and points them to the proper page or to Ontiretse Bagwasi."*
