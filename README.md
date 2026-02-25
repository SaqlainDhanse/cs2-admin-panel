# CS2 Administrative Panel 🎮

![CS2 Banner](https://img.shields.io)
![NodeJS](https://img.shields.io)
![React](https://img.shields.io)
![Tailwind](https://img.shields.io)
![License](https://img.shields.io)

A high-performance, unified management dashboard for **Counter-Strike 2** communities. This panel serves as a secure bridge between your **MySQL Game Database** (CounterStrikeSharp/Source2Admin) and the **Pterodactyl Client API**.

---

## 🚀 Key Features

### 🛠️ Server Management (Obfuscated Wrapper)
- **Unified Control:** Manage multiple servers across different regions (EMEA, APAC, NA) in one view.
- **Power Actions:** Role-restricted Start, Stop, Restart, and Kill commands.
- **Direct Connect:** One-click "Join" button using the `steam://` protocol.
- **Internal Security:** Pterodactyl IDs and API keys are strictly backend-only.

### 🛡️ Hierarchical RBAC (Role-Based Access Control)

| Role | Permissions |
| :--- | :--- |
| **Administrator** | Full control, User management, VIP/Admin editing, all Power Actions. |
| **Senior Moderator** | Manage Bans, **Restart** servers (Start/Stop restricted). |
| **Moderator** | Manage Player Bans and view basic server statistics. |

### 📜 Professional Audit Logging
Every write operation (POST, PUT, DELETE) is tracked with **State-Change Detailing**:
- **Granular Logs:** Records exactly what changed (e.g., *Email changed from A to B*).
- **Categorization:** Logs are tagged by `Log Type` (Moderator, Senior Moderator, Administrator).
- **Accountability:** Tracks the specific staff member responsible for every action.

### 📊 Consolidated Analytics
- A single-call API aggregates stats for Total Servers, Active Bans, Active Admins, and VIP counts.

---

## 🏗️ Tech Stack

- **Frontend:** React 18 (Vite), Tailwind CSS, Lucide Icons, Shadcn/UI.
- **Backend:** Node.js, Express, JWT (JSON Web Tokens).
- **Database:** MySQL 8.0 (Game Data) + Pterodactyl Client API integration.
- **Communication:** Axios (Backend) & Custom Authenticated Fetch Interceptor (Frontend).

---

## ⚙️ Installation & Setup

### 1. Backend Configuration
Edit apps/api/.env
```env
PORT=5000
JWT_SECRET=your_super_secret_key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cs2_management

# Pterodactyl Integration
PTERO_BASE_URL=https://panel.example.com
PTERO_API_KEY=ptlc_YOUR_CLIENT_API_KEY
