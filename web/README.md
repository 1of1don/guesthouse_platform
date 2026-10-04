# Mi Casa Su Casa — Admin Portal (Web Frontend)

> **BIUST — Department of Computing and Informatics**  
> Group Project: Guesthouse Discovery Platform (Airbnb-style listing app)  
> This repository contains the **web admin portal** used by administrators to manage guesthouse listings.

---

## 📖 Project Overview

This is the **web frontend** for a guesthouse discovery platform. Admins use this portal to:

- Log in securely
- View platform-wide statistics (total guesthouses, top city, highest rated, new this month)
- Register, edit, and delete guesthouse listings
- Manage other admin accounts (create / remove)

There is **no booking or payment functionality** — this is a listing discovery platform only. The companion **mobile customer app** and **backend API** are maintained in separate repositories by other group members.

---

## 🛠 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **React 18** | Required by the assignment brief |
| Language | **TypeScript** | Required by the assignment brief — enforces types across models and props |
| Build tool | **Vite** | Fast HMR, modern ESM-based bundler, minimal config |
| Routing | **React Router v6** | Nested routes for the admin portal shell |
| State | React **Context API** | Lightweight auth state (token in `localStorage`) |
| Styling | **Plain CSS** + CSS variables | Keeps the stack minimal; no extra runtime dependencies. Design tokens centralised in `src/index.css` |
| HTTP | *(to be wired)* — currently a **mock API layer** in `src/services/api.ts` | Lets the UI work end-to-end before the backend is connected |

---

## 📁 Project Structure
