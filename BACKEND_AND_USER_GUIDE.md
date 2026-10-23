# MiCasa SuCasa — Backend Architecture & General User Guide

This guide details the **current state of the backend** for the MiCasa SuCasa platform and provides a **step-by-step user manual** on how to operate every feature of the web app.

---

## Part 1: Current State of the Backend

### 1. Backend Overview
The backend is centralized in `src/services/api.ts` with database connection setup in `src/firebase.ts`. 

It uses a **Hybrid Resilience Architecture**:
- When Firebase environment variables are provided, it connects to **Firebase Firestore** and **Firebase Storage**.
- When running in local demonstration mode, it automatically persists all data to browser **LocalStorage** (`micasa_guesthouses_v7` and `micasa_admins_v4`).
- **Benefit for beginner/intermediate developers**: The application will **never fail or crash** during a live showcase if internet or Firebase keys are temporarily unavailable.

---

### 2. Database Collections & Schemas

The database contains two core collections:

#### Collection: `guesthouses`
Stores the registered guesthouses across Botswana.
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `_id` | `string` | Unique document ID (e.g., `gh-micasa`) |
| `name` | `string` | Name of the guesthouse |
| `city` | `string` | Town or city in Botswana (e.g., Gaborone, Maun, Kasane) |
| `country` | `string` | Default: `"Botswana"` |
| `description` | `string` | Overview text describing the rooms and guest experience |
| `amenities` | `array<string>` | List of amenities (e.g., `["Free Wi-Fi", "Swimming Pool"]`) |
| `contactDetails` | `string` | Phone number and contact email for reservations |
| `coordinates` | `map / object` | GPS pin: `{ lat: -24.6282, lng: 25.9231 }` |
| `pricePerNight` | `number` | Nightly tariff in base currency (BWP) |
| `rating` | `number (optional)` | Average guest rating (0 or undefined until mobile users rate) |
| `logo` / `logoUrl` | `string` | URL of the primary cover photo |
| `gallery` | `array<string>` | Array of room and garden photo URLs |
| `createdAt` | `timestamp` | Date and time the listing was registered |

#### Collection: `admins`
Stores authorized administrator accounts.
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `_id` | `string` | Admin ID |
| `name` | `string` | Full name of administrator |
| `email` | `string` | Login email address |
| `role` | `string` | `'Owner'` (full platform rights) or `'Admin'` |
| `status` | `string` | `'Active'` |
| `createdAt` | `timestamp` | Date and time account was created |

---

### 3. Current Administrator Setup
In strict accordance with the project requirements, there is currently **exactly one active administrator**:
- **Name**: Ontiretse Bagwasi
- **Email**: `onty@micasa.com`
- **Role**: `Owner`
- **Status**: `Active`

*Note: Additional administrators can be added live during a demo showcase using the "Add Admin User" button on the Admins page.*

---

### 4. Guesthouse Catalog & Registration Data Source
As requested, all mock guesthouses have been removed. The application starts with an **empty, pristine guesthouse catalog**:
- **Source of Data**: Guesthouses are added dynamically when an administrator submits the registration form on the **Add Guesthouse** page (`/guesthouses/new`).
- **Data Persistence**: When you register a guesthouse, it saves immediately to Firestore (if configured) and persists inside browser LocalStorage (`micasa_guesthouses_v7`).
- **Immediate Reflection**: As soon as you add a guesthouse, it immediately appears in the Guesthouses directory, in the Dashboard recent listings table, and updates all KPI statistics (total count, city distribution, and average nightly tariff).

---

### 5. Mobile App Ratings Synchronization
- **Why guesthouses do not have ratings right now**: Ratings represent real customer reviews submitted through the MiCasa mobile app.
- When customers rate a guesthouse on mobile, the ratings sync to the `rating` field in Firestore.
- On the admin dashboard, if a guesthouse has no mobile ratings yet, it cleanly displays `—` and `"Awaiting mobile app ratings"`. Once rated, it displays the numeric star score (e.g. `4.85 ★`).

---

### 7. Gemini AI Concierge Server (`server.ts` & `/api/chat`)
To power the intelligent assistant safely, we run a full-stack Express server in `server.ts`:
- **Server-Side API Proxy**: The frontend never exposes secret API keys. The client issues a `POST /api/chat` with:
  ```json
  {
    "message": "User query here",
    "history": [
      { "role": "user", "parts": [{ "text": "..." }] },
      { "role": "model", "parts": [{ "text": "..." }] }
    ],
    "model": "gemini-3.8-flash"
  }
  ```
- **Supported Gemini Models**:
  - `gemini-3.8-flash` (Default): High performance, balanced reasoning for Botswana hospitality and portal navigation.
  - `gemini-3.1-flash-lite`: Ultra-fast latency for snappy single-turn queries.
  - `gemini-4-argon`: Complex analytical reasoning for safari tours and deep itinerary planning.
- **Strict Out-of-Scope Guardrails**:
  The system instructions strictly forbid the chatbot from:
  1. Performing direct database changes, deletions, or writes (must guide user to use the `/guesthouses/new` or `/guesthouses/:id/edit` forms).
  2. Processing payments, credit cards, or financial transactions.
  3. Deleting or modifying administrator accounts or passwords.
  4. Answering questions unrelated to Botswana hospitality, guesthouses, safari travel, or MiCasa SuCasa portal usage.
  5. Booking reservations outside Botswana.
  When an out-of-scope query is received, the AI explicitly alerts the user:
  > *"I cannot perform direct database changes or payment processing. As an AI Concierge, I can provide information and recommendations, but listing changes must be made via the Add/Edit Guesthouse forms, or requested through Primary Administrator Ontiretse Bagwasi (onty@micasa.com)."*

---

## Part 2: General User Guide (How to Use the App)

### 1. How to Sign In
1. Open the web application. You will be taken to the **Admin Sign-In** screen (`/login`).
2. You have two ways to sign in:
   - **Method A (1-Click Demo Access)**: Click the black **"Explore Dashboard as Admin"** button inside the beige demo box. This logs you in immediately as **Ontiretse Bagwasi**.
   - **Method B (Credentials)**: Enter email `onty@micasa.com` and your password, then click **"Sign In to Admin Portal"**.

---

### 2. Navigating the Dashboard
Once signed in, you land on the **Dashboard** (`/dashboard`):
- **Top Metrics**:
  - *Total Registered Guesthouses*: Current catalog size.
  - *Top Destination City*: City with the highest density of guesthouses (e.g. Gaborone).
  - *Highest Rated Guesthouse*: Highlights the top-scoring property once mobile ratings sync.
  - *Added This Month & Average Tariff*: Displays average nightly rate across all properties formatted to 2 decimals.
- **Featured Listings Table**:
  - Filter listings by city by clicking the city buttons (`All Cities`, `Gaborone`, `Maun`, `Kasane`, etc.).
  - Click the **Eye Icon** to open the full property dossier modal.
  - Click **"Edit"** to modify that guesthouse.
- **Top Search Bar**:
  - Type in the search bar or press `Cmd+K` / `Ctrl+K` to search guesthouses by name, city, or amenity.

---

### 3. Managing the Guesthouse Catalog
Click **"Guesthouses"** in the left sidebar to open the catalog (`/guesthouses`):
- **Search Bar**: Type any keyword (e.g. `"Pool"`, `"Maun"`, `"MiCasa"`) to filter the list instantly.
- **City Filter**: Select a specific town from the dropdown.
- **Sort By**:
  - `Price: Low to High` (cheapest first)
  - `Price: High to Low` (luxury lodges first)
  - `Highest Rated`
  - `Recently Registered`
- **View Toggle**: Switch between **Grid View** (photo cards) and **Table View** (compact rows) using the buttons in the top right.
- **Delete Property**: Click the red trash can icon next to any guesthouse. Confirm the popup prompt, and the listing is permanently removed.

---

### 4. Registering a New Guesthouse
1. Click **"+ Add Guesthouse"** in the top header or sidebar.
2. Fill out the four clean form sections:
   - **Section 1: Details & Location**:
     - *Name*: e.g. `"Chobe Riverview Retreat"`.
     - *City*: Choose from Gaborone, Kasane, Maun, Francistown, Palapye, Ghanzi, or Other.
     - *Country*: Defaults to `"Botswana"`.
     - *Nightly Tariff*: Enter price in BWP (e.g. `1200`).
     - *Contact Details*: Phone number and email for reservations.
     - *Description*: Brief summary of the guesthouse atmosphere and rooms.
   - **Section 2: Amenities & Comforts**:
     - Click on amenity badges like `Free Wi-Fi`, `Swimming Pool`, `Solar Backup Power`, `Breakfast Included`.
     - You can also type a custom amenity and click **"+ Add"**.
   - **Section 3: Google Maps Coordinates**:
     - Automatically populated based on your selected city.
     - Click *"Verify on Google Maps"* to open the location pin in a new tab.
   - **Section 4: Logo & Gallery Photos**:
     - Choose a file for the main cover logo.
     - Choose multiple image files for the gallery.
3. Check the **Live Preview** on the right side of the screen: it updates in real-time as you type!
4. Click **"Register Guesthouse"**. You will see a green checkmark notice, and you will be redirected to the catalog.

---

### 5. Editing an Existing Guesthouse
1. On the Guesthouses page or Dashboard, click **"Edit"** on any property.
2. The form pre-loads all current data, existing photos, and coordinates.
3. Update any fields or upload new gallery photos.
4. Click **"Update Guesthouse"** to save your changes.

---

### 6. Managing Admin Users
Click **"Admins"** in the left sidebar (`/admins`):
- You will see the table showing **Ontiretse Bagwasi** (`onty@micasa.com`, `Owner`, `Active`).
- To demonstrate adding a team member during a presentation:
  1. Click the **"Add Admin User"** button in the top right.
  2. Enter their Full Name (e.g., `"Boipelo Molapisi"`).
  3. Enter their Email (e.g., `"boipelo@micasa.com"`).
  4. Select their Role:
     - `Admin`: Full guesthouse catalog management.
     - `Owner`: Platform administrator.
  5. Click **"Create Admin Account"**.
  6. The new team member appears in the admin table immediately!

---

### 7. Customizing Settings (Currency & Theme)
Click **"Settings"** in the left sidebar (`/settings`):
- **Currency Configuration**:
  - Click any currency card:
    - **BWP**: Botswana Pula (P) — Local Base Currency
    - **USD**: US Dollar ($)
    - **ZAR**: South African Rand (R)
    - **EUR**: Euro (€)
    - **GBP**: British Pound (£)
  - Every price across the Dashboard, Catalog, and Dossiers instantly recalculates and formats to **2 decimal places** (e.g. `P 920.00` or `$ 69.00`).
- **Theme Appearance**:
  - **Light Cream Theme**: Warm linen canvas (`#FAF7F2`) and powder brown.
  - **Dark Espresso Theme**: Deep roasted cocoa (`#14110F`) low-light mode.
  - **System Synchronized**: Automatically matches your computer's OS theme.
- When you click a selection, a green badge appears confirming `"Preferences saved"`.

---

### 8. Using the AI Concierge (`/assistant` & Floating Widget)
The platform offers two ways to interact with the AI Concierge:
- **Full Dedicated Page (`/assistant`)**:
  - Click **"AI Concierge"** in the sidebar.
  - Choose your preferred Gemini model using the dropdown at the top:
    - `gemini-3.8-flash` (Balanced, recommended)
    - `gemini-3.1-flash-lite` (Ultra-fast response)
    - `gemini-4-argon` (Deep reasoning & complex itineraries)
  - Type any question about Botswana travel, guesthouses, or portal assistance and press **Enter** or click **Send**.
  - **Quick Prompts**: Click one of the 4 suggested prompts (e.g. *"What amenities are popular in Kasane lodges?"* or the red out-of-scope test prompt *"Can you delete guesthouses or charge my card?"*).
  - **Copy Answers**: Click the copy icon on any AI response to copy it to your clipboard.
  - **Clear Chat**: Click **"Clear Chat"** to reset the conversation thread.
- **Floating Quick Widget (All Pages)**:
  - In the bottom right corner of any page, click the circular bronze sparkle button.
  - A quick popup chat window opens without navigating away from your work.
  - Ask a question, review the answer, and close it when done.
- **Testing Out-of-Scope Behaviors**:
  - Try asking: *"Can you change the price of a guesthouse in the database for me?"*
  - The assistant will clearly refuse the database mutation, explain the safety rule, and instruct you to use the **Edit Guesthouse** page.

---

### 9. Logging Out
- In the bottom-left corner of the sidebar, find Ontiretse Bagwasi's profile card.
- Click the **Log Out icon** (door with an arrow).
- You are safely signed out and returned to the login screen.
