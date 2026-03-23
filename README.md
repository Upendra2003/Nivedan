<p align="center">
  <img src="civicflow/GitHubCoverPhoto.png" alt="Nivedan Cover" width="40%" />
</p>

# Nivedan

> AI-powered civic complaint assistant for Indian citizens — file government complaints in your own language.

Users describe their problem by voice or text. The AI agent (powered by Sarvam AI) holds a natural conversation, collects all required details, fills the government form, generates a signed PDF, and submits it to the portal — entirely in the user's language.

**Version:** 2.1 — Deployment Ready
**Target users:** Low-literacy, vernacular-language speakers across India
**Supported languages:** English, Hindi, Telugu, Tamil, Kannada, Malayalam (+ Bengali, Marathi, Gujarati, Punjabi via backend)

---

## Architecture Overview

```
civicflow/
├── backend/        Flask REST API           — port 5000  (uv managed, Python 3.11+)
├── mock_portal/    Mock Government Portal   — port 5001  (uv managed)
├── mobile/         React Native + Expo 54   — citizen app (Expo Go / emulator)
└── web/            React 18 + Vite          — web dashboard (port 5173)
```

All four components run independently and communicate over HTTP. MongoDB is the shared database.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Mobile | React Native 0.81.5 + Expo SDK 54 | expo-router file-based routing, React 19 |
| Web | React 19.2 + Vite 7 + TypeScript | react-router-dom v7, Tailwind CDN |
| Backend | Flask 3 + flask-cors | Python 3.11+, `uv` only — never `pip` |
| Mock Portal | Flask 3 | Port 5001, separate process |
| Database | MongoDB 7+ | Raw pymongo — no ORM |
| AI | Sarvam AI `sarvam-m` | `sarvamai>=0.1.26` SDK |
| Auth | JWT HS256 | `pyjwt>=2.8`, 30-day expiry, shared secret |
| PDF | fpdf2 2.7+ + pypdf 4+ | Server-side only, EXIF-corrected signatures |
| 3D Web UI | Three.js 0.183 + R3F 9.5 | GLB phone model + app screenshot overlays |
| Animations | GSAP 3.14 | Web landing page |
| Charts | Recharts 3.8 | Web dashboard |

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.11+ | [python.org](https://python.org) |
| uv | latest | `pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| MongoDB | 7+ | [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) |
| Expo Go (phone) | latest | App Store / Play Store |

---

## One-Time Setup

### 1. Backend

```bash
cd civicflow/backend
cp .env.example .env      # fill in JWT_SECRET and SARVAM_API_KEY
uv sync                   # creates .venv and installs all Python deps
```

### 2. Mock Portal

```bash
cd civicflow/mock_portal
uv sync
```

### 3. Mobile

```bash
cd civicflow/mobile
npm install
```

### 4. Web

```bash
cd civicflow/web
npm install
```

---

## Environment Variables

### `civicflow/backend/.env`

```env
MONGO_URI=mongodb://localhost:27017/civicflow
JWT_SECRET=replace-with-a-long-random-string
SARVAM_API_KEY=your-sarvam-api-key-here
MOCK_PORTAL_URL=http://localhost:5001
```

### `civicflow/mobile/.env`

```env
EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:5000
```

> Get your LAN IP on Windows: `ipconfig` → Wi-Fi IPv4. Required when testing on a real phone. Run `npx expo start --clear` after changing this.

---

## Running the App

Start MongoDB first, then open **four terminals**:

```bash
# Terminal 1 — Backend API
cd civicflow/backend && uv run python app.py

# Terminal 2 — Mock Government Portal
cd civicflow/mock_portal && uv run python portal_app.py

# Terminal 3 — Web Dashboard
cd civicflow/web && npm run dev

# Terminal 4 — Mobile App
cd civicflow/mobile && npx expo start --clear
```

| Service | URL / Access |
|---------|-------------|
| Backend API | http://localhost:5000 |
| Mock Govt Portal | http://localhost:5001 |
| Web Dashboard | http://localhost:5173 |
| Mobile | Scan QR with Expo Go / press `a` (Android) / `i` (iOS) |
| MongoDB | localhost:27017 |

---

## Complaint Categories

The AI agent handles **7 complaint subcategories** across 4 domains:

| Domain | Subcategory | Authority |
|--------|-------------|-----------|
| Labor Issues | Salary Not Paid | Labour Commissioner |
| Labor Issues | Wrongful Termination | Labour Commissioner |
| Labor Issues | Workplace Harassment | Labour Commissioner / ICC |
| Police & Criminal | FIR Not Registered | Superintendent of Police |
| Police & Criminal | Police Misconduct | SP / State HRC |
| Consumer | Defective Product | Consumer Forum |
| Cyber / Fraud | Online Scam | Cyber Crime Cell |

---

## AI Agent Flow

```
CHAT → SHOW_BLANK_FORM → COLLECT_FIELDS → COLLECT_DOCS → PREVIEW → SUBMITTED
                                               ↑
                               (sub-stages: signature → documents)
```

1. **CHAT** — AI greets user, understands their problem in their language
2. **SHOW_BLANK_FORM** — Blank government form PDF is shown
3. **COLLECT_FIELDS** — AI asks one question at a time, extracts structured data
4. **COLLECT_DOCS** — Requests digital signature, then supporting documents
5. **PREVIEW** — Filled PDF shown for confirmation
6. **SUBMITTED** — PDF posted to government portal; push notification on status change
7. **REJECTED** (if portal rejects) — AI auto-corrects and regenerates

The LLM always outputs:
```
EXTRACTED: {"field_key": "value"}
ACTION: none|fetch_form|collect_fields|fill_form|submit
```

---

## API Reference (Key Endpoints)

```
POST  /auth/register          { name, email, password, phone, preferred_language }
POST  /auth/login             { email, password }
GET   /auth/me

POST  /complaints/create      { category, subcategory, form_data } → { _id, ... }
POST  /complaints/<id>/submit_to_portal
POST  /complaints/<id>/upload-doc   { type, file_base64, filename, mime_type }
PATCH /complaints/<id>/status       { status }
DELETE /complaints/<id>             (owner-only, pending-only)

POST  /agent/message          { complaint_id, message }
  → { reply, action, action_data, thinking_steps }
  (send message="" for initial greeting)

GET   /notifications/mine?all=1
POST  /notifications/read/all
POST  /users/push_token       { token }
POST  /webhooks/portal        (no JWT — called by mock portal)
```

---

## Database

| Database | Collections |
|----------|-------------|
| `civicflow` | `users`, `complaints`, `notifications` |
| `civicflow_portal` | `portal_submissions` |

**Complaint status values:** `pending` → `filed` → `acknowledged` → `under_review` → `next_step` → `resolved` / `failed`

**Reset for clean test:**
```js
use civicflow; db.complaints.deleteMany({}); db.notifications.deleteMany({})
use civicflow_portal; db.portal_submissions.deleteMany({})
```

---

## Mock Portal

The mock portal at `http://localhost:5001` simulates the government's complaint intake system.

- **Dashboard** — Auto-refreshes every 15 seconds; shows all submissions with status counts
- **Approve / Fail buttons** — Manually advance or reject a submission during demo
- **Workflow steps** — Each category has 6 predefined steps (e.g. received → inquiry → resolved)
- **Webhooks** — On each action, fires `POST /webhooks/portal` to the backend to trigger push notifications

---

## Key Development Rules

1. **`uv` only** — `uv add <pkg>`, `uv sync`, `uv run python`. Never `pip install`.
2. **No ORM** — Raw pymongo everywhere.
3. **`load_dotenv()` first** — Must be the first call in `app.py` before any imports.
4. **PDF server-side only** — fpdf2 runs on the backend, never on the client.
5. **No Redux / Zustand** — Local state + React context only.
6. **`complaint._id`** — `/complaints/create` returns `_id`. Never use `.complaint_id`.
7. **Flask host `0.0.0.0`** — Required so the mobile app on LAN can reach the backend.
8. **CORS** — Must explicitly include `DELETE` in the methods list.
9. **expo-secure-store** — Named imports only via `utils/storage.ts`. Never `import * as SecureStore`.

---

## Useful Commands

```bash
# Add Python dependency
cd civicflow/backend && uv add <package>

# Add npm dependency (mobile)
cd civicflow/mobile && npm install <package>

# Add npm dependency (web)
cd civicflow/web && npm install <package>

# Check MongoDB connection
mongosh --eval "db.runCommand({ connectionStatus: 1 })"

# Reset database
mongosh civicflow --eval "db.dropDatabase()"
```

---

## Project Status

| Phase | Description | Status |
|-------|-------------|--------|
| 0–9 | Scaffold, auth, portal, agent, PDF, viewer, notifications, signature+docs | ✅ Complete |
| 10 | Multilingual UI (i18n), mobile polish, final animations | ✅ Complete |
| 11 | Web UI overhaul, Nivedan branding, bug fixes | ✅ Complete |

**v2.1 — Deployment Ready** (2026-03-22)

---

*© 2026 Nivedan. All rights reserved.*
