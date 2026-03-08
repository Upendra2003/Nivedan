# CivicFlow

AI-powered civic legal assistant for Indian citizens.
Users describe their problem by voice or text, the AI collects required details, fills the government form, and submits it — in their own language.

---

## Prerequisites

Install these before anything else:

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.11+ | [python.org](https://python.org) |
| uv | latest | `pip install uv` or `curl -Lsf https://astral.sh/uv/install.sh \| sh` |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| MongoDB | 7+ | [mongodb.com](https://www.mongodb.com/try/download/community) |
| Expo Go (phone) | latest | App Store / Play Store |

---

## One-Time Setup

### 1. Clone / enter the project

```bash
cd civicflow
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # then edit .env and fill in JWT_SECRET and SARVAM_API_KEY
uv sync                       # creates .venv and installs all Python deps
```

### 3. Mobile

```bash
cd mobile
npm install
```

### 4. Web dashboard

```bash
cd web
npm install
```

### 5. Start MongoDB

```bash
# macOS / Linux
mongod --dbpath /data/db

# Windows
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath C:\data\db
```

---

## Running the App

Open **four terminals** — one per component.

### Terminal 1 — Backend API (port 5000)

```bash
cd civicflow/backend
uv run python app.py
```

Expected output:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### Terminal 2 — Mock Government Portal (port 5001)

```bash
cd civicflow/mock_portal
uv run python portal_app.py
```

Expected output:
```
 * Running on http://127.0.0.1:5001
 * Debug mode: on
```

Open **http://localhost:5001** in a browser to see the portal dashboard.
Use the Approve / Fail buttons to manually action submissions during demo.

### Terminal 3 — Web Dashboard (port 5173)

```bash
cd civicflow/web
npm run dev
```

Open **http://localhost:5173** in a browser.

### Terminal 4 — Mobile App

```bash
cd civicflow/mobile
npx expo start
```

- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Scan the QR code with **Expo Go** on your phone

---

## Environment Variables

All backend config lives in `backend/.env` (copy from `.env.example`):

```env
MONGO_URI=mongodb://localhost:27017/civicflow
JWT_SECRET=replace-with-a-long-random-string
SARVAM_API_KEY=your-sarvam-api-key-here
SARVAM_API_URL=https://api.sarvam.ai
MOCK_PORTAL_URL=http://localhost:5001
```

Mobile API URL — create `mobile/.env` if you need a custom backend URL:

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000   # use your LAN IP if testing on a real phone
```

Web API URL — create `web/.env` if needed:

```env
VITE_API_URL=http://localhost:5000
```

---

## Demo Flow (Phase 1 — Salary Not Paid)

1. Open mobile app → tap **Labor Issues**
2. The AI agent asks for employer name, address, unpaid months, amount owed
3. User answers (text or voice)
4. Agent shows filled form summary → user confirms
5. Backend generates PDF and POSTs it to mock portal (port 5001)
6. Open **http://localhost:5001** → click **Approve**
7. Mobile app receives status update → case marked approved

---

## Project Structure

```
civicflow/
  backend/          Flask REST API (port 5000) — uv managed
  mock_portal/      Fake govt portal (port 5001) — manual approve/fail
  mobile/           React Native + Expo — citizen app
  web/              React + Vite — admin dashboard (port 5173)
  CLAUDE.md         AI assistant memory — architecture, decisions, phase progress
  README.md         This file
```

---

## Useful Commands

```bash
# Add a new Python dependency
cd backend && uv add <package-name>

# Add a new npm dependency (mobile)
cd mobile && npm install <package-name>

# Add a new npm dependency (web)
cd web && npm install <package-name>

# Check MongoDB is running
mongosh --eval "db.runCommand({ connectionStatus: 1 })"

# Reset the local database
mongosh civicflow --eval "db.dropDatabase()"
```

---

## Ports at a Glance

| Service | URL |
|---------|-----|
| Backend API | http://localhost:5000 |
| Mock Govt Portal | http://localhost:5001 |
| Web Dashboard | http://localhost:5173 |
| Mobile | Expo QR / emulator |
| MongoDB | localhost:27017 |
