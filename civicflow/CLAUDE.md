# CivicFlow — Project Memory

> Single source of truth. Read this first, read no other file unless making a targeted edit.
> Update this after every session with anything that would slow down the next session.

---

## How to Start a Session

1. Read this file top to bottom (you're doing it now).
2. Ask the user what phase/feature they want to work on.
3. Read only the specific files you are about to edit — nothing else.
4. Code, then update this file at the end.

---

## What This App Does

CivicFlow helps Indian citizens file government complaints in their own language.

User flow (mobile):
1. User picks a legal category (e.g. "Salary Not Paid")
2. AI agent (Sarvam) has a natural conversation to understand the problem
3. Agent fetches the blank government form and shows it in-chat
4. User says "fill it" → agent collects required fields conversationally → generates filled PDF
5. User reviews filled PDF → confirms → agent submits to mock portal
6. User gets status updates (webhook → Expo push notification) as case progresses

Target users: low-literacy, vernacular-language speakers.
Languages: Hindi, Tamil, Telugu, Kannada, Malayalam, English (via Sarvam AI — model: sarvam-m).

---

## Start Commands (run these every session)

```bash
# Terminal 1 — Backend API
cd civicflow/backend
uv run python app.py
# → Running on http://0.0.0.0:5000

# Terminal 2 — Mock Govt Portal
cd civicflow/mock_portal
uv run python portal_app.py
# → Running on http://0.0.0.0:5001  (open in browser for approve/fail buttons)

# Terminal 3 — Web Dashboard
cd civicflow/web
npm run dev
# → http://localhost:5173

# Terminal 4 — Mobile
cd civicflow/mobile
npx expo start --clear
# Press 'a' = Android emulator, 'i' = iOS sim, 'w' = browser, scan QR = physical device
```

MongoDB must be running separately: `mongod` (or MongoDB Compass).

---

## Ports

| Service | URL |
|---------|-----|
| Backend API | `http://0.0.0.0:5000` (LAN-accessible) |
| Mock Portal | `http://localhost:5001` |
| Web Dashboard | `http://localhost:5173` |
| Mobile API target | `http://10.30.29.68:5000` (set in `mobile/.env`) |

---

## Environment Files

### `backend/.env` (copy from `.env.example`)
```
MONGO_URI=mongodb://localhost:27017/civicflow
JWT_SECRET=<strong-random-string>
SARVAM_API_KEY=<from-sarvam-dashboard>
MOCK_PORTAL_URL=http://localhost:5001
```

### `mobile/.env`
```
EXPO_PUBLIC_API_URL=http://10.30.29.68:5000
```
> If the laptop's Wi-Fi IP changes, update this and restart Expo with `--clear`.
> Get current IP: `ipconfig` → look for Wi-Fi IPv4.

---

## Tech Stack (do not change these without updating this file)

| Layer | Choice | Critical notes |
|-------|--------|----------------|
| Mobile | React Native + Expo SDK 54 | expo-router file-based routing |
| Web | React 18 + Vite + react-router-dom | TypeScript |
| Backend | Flask 3 + flask-cors | **uv only — never pip** |
| Mock Portal | Flask 3 | Separate process, port 5001 |
| Database | MongoDB | Raw pymongo — **no ORM** |
| AI | Sarvam AI (`sarvamai` SDK) | Model: `sarvam-m`. `SarvamAI(api_subscription_key=KEY)` |
| Auth | JWT (pyjwt) | HS256, 30-day expiry, same token for mobile + web |
| PDF | fpdf2 | Server-side only — never client |
| Python deps | uv | `uv add <pkg>`, `uv sync`, `uv run python app.py` |
| JS deps | npm | `npm install <pkg>` |

---

## Complete File Map

### Backend (`civicflow/backend/`)
```
app.py                      Flask app entry point
                            - load_dotenv() FIRST (before all imports)
                            - host="0.0.0.0" so mobile on LAN can reach it
                            - registers blueprints: auth, complaints, forms,
                              notifications, users, webhooks, agent

routes/auth.py              POST /auth/register, POST /auth/login, GET /auth/me
routes/complaints.py        POST /complaints/create  — creates doc, returns full doc (_id field)
                            GET  /complaints/         — list user's complaints
                            GET  /complaints/mine     — list + counts
                            GET  /complaints/<id>     — full doc with timeline
                            POST /complaints/<id>/submit_to_portal
                            POST /complaints/<id>/resubmit
                            PATCH /complaints/<id>/status
                            POST /complaints/<id>/chat  — OLD agent chat (Phase 1b, still present)
routes/agent.py             POST /agent/message  — Phase 6 AI agent endpoint
                              Body: { complaint_id, message }
                              Returns: { reply, action, action_data, thinking_steps }
routes/forms.py             GET  /forms/<form_name>   — proxy to mock portal PDF
                            POST /forms/generate      — { form_name, form_data } → { pdf_base64 }
routes/notifications.py     GET  /notifications/mine
                            POST /notifications/read/<id>
routes/users.py             POST /users/push_token
routes/webhooks.py          POST /webhooks/portal

db.py                       MongoDB connection — import `db` from here in every route

models/user.py              user_schema(name, email, phone, password_hash, preferred_language)
models/complaint.py         complaint_schema(user_id, category, subcategory, form_data, title)

services/auth_middleware.py @jwt_required decorator → sets flask.g.user = full user doc
services/sarvam.py          chat_completion(messages, system_prompt) → str
                            Uses: sarvamai SDK, SarvamAI(api_subscription_key=SARVAM_API_KEY)
                            Model: "sarvam-m"
                            response.choices[0].message.content (may be None → return "")
                            transcribe_audio / text_to_speech / translate → NotImplementedError

services/agent_runner.py    Phase 6 AI agent state machine
                            States: CHAT → SHOW_BLANK_FORM → COLLECT_FIELDS → PREVIEW → SUBMITTED
                            run_agent(complaint_id, user_message, user) → dict
                            - Empty message + CHAT state → hardcoded greeting in user's language
                            - CHAT: natural conversation, LLM decides when to ACTION: fetch_form
                            - SHOW_BLANK_FORM: shows blank PDF, waits for "fill it"
                            - COLLECT_FIELDS: LLM extracts fields via EXTRACTED: {...} at end
                            - All 8 fields collected → generate_pdf_b64 → ACTION: fill_form
                            - PREVIEW: shows filled PDF, waits for confirm → ACTION: submit
                            - SUBMITTED: submits to portal, updates DB, returns status_update
                            LLM output format (always ends with):
                              EXTRACTED: {"field_key": "value"}
                              ACTION: none|fetch_form|collect_fields|fill_form|submit
                            Salary fields: complainant_name, employer_name, employer_address,
                              employment_start_date, last_paid_date, months_pending,
                              amount_pending, attempts_made
                            Auto-prefills complainant_name from user.name

services/form_handler.py    FIELD_DEFINITIONS for old agent chat (Phase 1b)
                            get_fields, next_missing_field, build_summary, submit_to_portal
services/pdf_generator.py   generate_salary_complaint_pdf(data) → bytes (old flow)
                            generate_salary_non_payment_pdf(data) → bytes  ← used by Phase 6
                              Fields: complainant_name, employer_name, employer_address,
                                employment_start_date, last_paid_date, months_pending,
                                amount_pending, attempts_made, declaration_date
                            generate_pdf_b64(form_name, data) → base64 str
                            generate_pdf(category, subcategory, data) → bytes

pyproject.toml              uv deps: flask, flask-cors, pymongo, pyjwt, fpdf2,
                            python-dotenv, requests, bcrypt, sarvamai
.env.example                Template — copy to .env and fill in secrets
```

### Mock Portal (`civicflow/mock_portal/`)
```
portal_app.py               Flask app, port 5001, MongoDB-backed (civicflow_portal db)
                            GET  /portal/dashboard          → render dashboard.html
                            POST /portal/submit             → receive complaint + PDF
                            GET  /portal/submissions        → JSON list
                            POST /portal/action             → advance or abort (fires webhook)
                            GET  /portal/pdf/<portal_ref_id>
                            GET  /portal/forms/salary_complaint → blank form PDF (fpdf2)

templates/dashboard.html    Dark theme, stats + table + step dots + action modals
                            Auto-refreshes every 15 seconds
pyproject.toml              [tool.uv] package = false
```

### Mobile (`civicflow/mobile/`)
```
app/_layout.tsx             Root layout — SafeAreaProvider > AuthProvider > Stack
                            Auth guard: no user → /auth/login | user+auth/* → /(tabs)

app/auth/login.tsx          Login screen, dark/light aware
app/auth/register.tsx       Register with language chip picker (6 languages)

app/(tabs)/_layout.tsx      Tabs: Home / My Cases / Profile
app/(tabs)/index.tsx        Home — category grid + subcategory bottom sheet (Modal+Animated.spring)
                            Recent cases section. Navigates to /chat/<subcategory_id>
app/(tabs)/dashboard.tsx    My Cases — GET /complaints/, pull-to-refresh, status badges
app/(tabs)/profile.tsx      User info + sign out

app/chat/[category].tsx     AI agent chat screen — param is SUBCATEGORY ID (e.g. salary_not_paid)
                            PHASE 6 FLOW:
                              1. POST /complaints/create → get doc._id (NOT complaint_id!)
                              2. POST /agent/message { complaint_id: doc._id, message: "" } → greeting
                              3. Each user turn → POST /agent/message { complaint_id, message }
                            Message types: user | agent | action_buttons | status_update | pdf_card
                            pdf_card has label: "blank_form"|"filled_form" — blank hides Submit btn
                            Stage: loading → chatting → confirming → submitted
                            ThinkingStrip: visible=thinking, steps=thinkingSteps from last response

components/ThinkingStrip.tsx Phase 6 redesign — Claude-like thinking display
                            Props: { visible: boolean; steps?: string[]; onDone?: () => void }
                            - visible=true: pulsing dot + cycling "Thinking.../Processing..." labels
                            - visible=false + steps: animate steps in one-by-one (350ms each)
                              with slide-in+fade-in, then hold 1.8s → call onDone
                            - phase: "loading" | "reveal" | "hidden"

components/PdfCard.tsx      Props: filename, pageCount?, onView, onApproveSubmit
components/PdfViewer.tsx    Full screen Modal. Web: iframe with data URI. Native: placeholder.
                            Props: visible, filename, pdfBase64, onClose, onApproveSubmit, onRequestChanges

constants/agentSteps.ts     AGENT_STEPS array (used as ThinkingStrip fallback)
constants/categories.ts     CATEGORIES with findSubcategory(subcategoryId) helper
constants/theme.ts          darkTheme, lightTheme, useTheme() hook

context/AuthContext.tsx     AuthProvider, useAuth() — login/register/logout + session restore
services/api.ts             api.get/post/authedGet/authedPost/authedPatch
                            URL: EXPO_PUBLIC_API_URL > Metro hostUri > localhost:5000
services/agent.ts           sendAgentMessage(complaintId, message) → AgentResponse
                            AgentResponse: { reply, action, action_data, thinking_steps }
                            action_data: { filename?, pdf_base64?, label?, buttons?,
                                          status?, portal_ref_id? }
services/auth.ts            loginUser, registerUser, storeToken, getToken, logout
utils/storage.ts            Platform-aware: web→localStorage, native→expo-secure-store

.env                        EXPO_PUBLIC_API_URL=http://10.30.29.68:5000
```

### Web (`civicflow/web/`)
```
src/main.tsx                Entry — ThemeProvider > AuthProvider > BrowserRouter > Routes
                            PrivateRoute guard wraps /dashboard, /cases/:id, /notifications
                            Routes: / → /login, /login, /register, /dashboard, /cases/:id, /notifications

src/context/AuthContext.tsx In-memory token (NOT localStorage) — _token in api.ts module
src/context/ThemeContext.tsx dark: boolean (default true) — applies 'dark' class to <html>

src/services/api.ts         In-memory _token, auto Authorization header
src/pages/Login.tsx         Tailwind dark/light, floating theme toggle
src/pages/Register.tsx      Language chip picker
src/pages/Dashboard.tsx     4 stat cards + case list (ProgressBar) + donut chart + notif feed
src/pages/CaseDetail.tsx    Timeline (latest first) + rejection panel + documents + form_data
src/pages/Notifications.tsx Filter tabs (All/Unread/Status Updates/Rejections) + mark-all-read
src/components/Layout.tsx   Sidebar + topbar (logo + theme toggle + avatar + sign out)
                            Fetches /notifications/mine for sidebar badge count

Tailwind: CDN in index.html — darkMode: 'class', tailwind.config = { darkMode: 'class' }
Recharts: PieChart for donut chart on dashboard
vite.config.ts: port 5173
```

---

## MongoDB Databases

| Database | Used by | Collections |
|----------|---------|-------------|
| `civicflow` | Backend API | `users`, `complaints`, `notifications` |
| `civicflow_portal` | Mock portal | `portal_submissions` |

To wipe for a clean test run:
```js
use civicflow
db.complaints.deleteMany({})
db.notifications.deleteMany({})

use civicflow_portal
db.portal_submissions.deleteMany({})
```

---

## MongoDB Schemas

### `users` collection
```js
{
  _id: ObjectId,
  name: String,
  email: String,           // unique
  phone: String,           // unique
  password_hash: String,   // bcrypt, never returned to client
  preferred_language: "en"|"hi"|"ta"|"te"|"kn"|"ml",
  push_token: String|null, // Expo push token
  created_at: Date,
}
```

### `complaints` collection (Phase 6 fields)
```js
{
  _id: ObjectId,
  user_id: ObjectId,
  category: String,          // "Labor Issues"
  subcategory: String,       // "salary_not_paid"
  title: String,
  status: "pending"|"filed"|"acknowledged"|"under_review"|"next_step"|"resolved"|"failed",
  form_data: Object,         // collected fields — filled by agent
  agent_state: "CHAT"|"SHOW_BLANK_FORM"|"COLLECT_FIELDS"|"PREVIEW"|"SUBMITTED",
  agent_history: Array,      // [{role, content}] last 40 messages for LLM context
  portal_ref_id: String|null,
  rejection_reason: String,
  resubmission_count: Number,
  current_step_label: String,
  timeline: [{ event, timestamp, detail }],
  documents: Array,
  created_at: Date,
  updated_at: Date,
}
```

---

## API Contract

### Auth
```
POST /auth/register  { name, email, password, phone, preferred_language }
POST /auth/login     { email, password }
GET  /auth/me        → { id, name, email, preferred_language }
```

### Agent (Phase 6)
```
POST /agent/message   jwt_required
  Body:    { complaint_id: string, message: string }
  Returns: { reply: string, action: null|"show_pdf"|"show_buttons"|"status_update",
             action_data: { filename?, pdf_base64?, label?, buttons?, status?, portal_ref_id? },
             thinking_steps: string[] }
  Note: send message="" for initial greeting (agent reads agent_state=CHAT + empty message)
```

### Complaints
```
POST /complaints/create   { category, subcategory, form_data } → full doc (use ._id field!)
GET  /complaints/         → list
GET  /complaints/mine     → { complaints, counts }
GET  /complaints/<id>     → full doc
POST /complaints/<id>/submit_to_portal  { pdf_base64 }
POST /complaints/<id>/resubmit          { pdf_base64, changes_summary }
```

### Forms / Notifications / Users / Webhook
```
GET  /forms/<form_name>           → blank PDF from portal
POST /forms/generate              { form_name, form_data } → { pdf_base64 }
GET  /notifications/mine          → unread notifications
POST /notifications/read/<id>     → mark read
POST /users/push_token            { token }
POST /webhooks/portal             (called by mock portal — no auth)
```

### PDF generator fields (generate_salary_non_payment_pdf)
```
complainant_name, employer_name, employer_address, employment_start_date,
last_paid_date, months_pending, amount_pending, attempts_made, declaration_date
```

---

## Patterns to Follow

### Backend route pattern
```python
from flask import Blueprint, request, jsonify, g
from db import db
from services.auth_middleware import jwt_required

bp = Blueprint("x", __name__)

@bp.route("/", methods=["GET"])
@jwt_required
def list_items():
    items = list(db.items.find({"user_id": g.user["_id"]}))
    for item in items:
        item["_id"] = str(item["_id"])
        item["user_id"] = str(item["user_id"])
    return jsonify(items), 200
```

### Mobile agent call pattern
```typescript
import { sendAgentMessage } from "../../services/agent";

// Initial greeting (empty message)
const greet = await sendAgentMessage(doc._id, "");

// User turn
const res = await sendAgentMessage(complaintId, userText);
// res.action: null | "show_pdf" | "show_buttons" | "status_update"
// res.thinking_steps: string[] — pass to ThinkingStrip steps prop
```

### Error message from backend on mobile
```typescript
} catch (e: any) {
  try { setError(JSON.parse(e.message).error); }
  catch { setError(e.message ?? "Something went wrong"); }
}
```

---

## Agent Design (Phase 6 — IMPLEMENTED)

Natural conversation → understand problem → blank form → collect fields → filled PDF → submit.

```
CHAT            Natural conversation in user's language. LLM outputs ACTION: fetch_form when ready.
SHOW_BLANK_FORM Blank PDF from GET /portal/forms/salary_complaint shown in chat.
                User says "fill it" → LLM outputs ACTION: collect_fields
COLLECT_FIELDS  LLM collects fields via EXTRACTED: {...} pattern. Auto-fills complainant_name.
                When all 8 fields present → Python generates PDF → ACTION: fill_form
PREVIEW         Filled PDF shown in chat. User confirms → LLM outputs ACTION: submit
SUBMITTED       Python calls portal, updates DB, returns action:"status_update"
```

LLM always ends response with two lines:
```
EXTRACTED: {"field_key": "value_from_user_message"}
ACTION: none|fetch_form|collect_fields|fill_form|submit
```

Language: `user.preferred_language` → LANG_NAMES dict → system prompt says "Respond ONLY in {language}".
Initial greeting is hardcoded (no LLM call) for en/hi/ta/te/kn/ml.

---

## Sarvam AI

```python
from sarvamai import SarvamAI
client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
response = client.chat.completions(messages=[...], model="sarvam-m")
text = response.choices[0].message.content or ""
```

`message.content` is `Optional[str]` — always use `or ""`.
Messages format: `[{"role": "system"|"user"|"assistant", "content": "..."}]`

---

## Key Rules (never break these)

1. **uv only** — `uv add pkg`, `uv sync`, `uv run python`. Never `pip install`.
2. **No ORM** — raw pymongo. Schema dicts in `models/`.
3. **load_dotenv() first** — must be the first line in `app.py` before any imports.
4. **JWT same everywhere** — mobile, web, backend all use same secret + algorithm.
5. **expo-secure-store** — always use named imports + `utils/storage.ts` wrapper. Never `import * as SecureStore`.
6. **PDF server-side only** — fpdf2, never rendered on client.
7. **No Redux/Zustand** — local state + context only.
8. **CORS open in dev** — flask-cors allows all origins.
9. **Flask host 0.0.0.0** — required for mobile on LAN to reach backend.
10. **mobile/.env IP** — if Wi-Fi IP changes, update `EXPO_PUBLIC_API_URL` and `npx expo start --clear`.
11. **complaint._id not .complaint_id** — `/complaints/create` returns `_id` (serialized full doc).

---

## Phases

- [x] **Phase 0** — Scaffold
- [x] **Phase 1** — Auth: register, login, JWT, mobile guard, web login/register
- [x] **Phase 2** — Mock Government Portal: dark UI, MongoDB, PDF serve, webhook
- [x] **Phase 1b** — Labor/Salary flow (old agent): field collection, PDF, portal submit
- [x] **Phase 3** — Backend core: complaint CRUD, forms, PDF generator, notifications, webhook, push token
- [x] **Phase 4** — Mobile app: home screen, category grid, bottom sheet, chat UI, ThinkingStrip, PdfCard, PdfViewer
- [x] **Phase 5** — Web dashboard: Login, Layout shell, Dashboard, CaseDetail, Notifications page
- [x] **Phase 6** — AI Agent: Sarvam integration, goal-oriented flow, language support, Claude-like thinking UI
- [ ] **Phase 7** — PDF Form Fill + In-App Viewer (native react-native-pdf, requires dev build)
- [ ] **Phase 8** — Notifications Loop (polling / WebSocket)
- [ ] **Phase 9** — Polish — Multilingual UI labels, final animations
- [ ] **Phase 10** — Demo Prep + Final Wiring

### Next task: Phase 7
Native PDF rendering in PdfViewer (currently placeholder on native).
Need `expo-dev-client` build + `react-native-pdf` library.

---

## Bugs Fixed (do not re-introduce)

| Bug | Cause | Fix |
|-----|-------|-----|
| `setValueWithKeyAsync is not a function` | `import * as SecureStore` on web | Named imports + `utils/storage.ts` Platform wrapper |
| Mobile "Network request failed" | `localhost` on phone = phone itself | Flask `host="0.0.0.0"` + `EXPO_PUBLIC_API_URL` in mobile/.env |
| Vite "Failed to load /src/main.tsx" | main.tsx never created | Created main.tsx, index.css manually |
| `hatchling` build error on `uv sync` | pyproject.toml had `[build-system]` but no package folder | Added `[tool.uv] package = false` |
| `POST /complaints/` returns 400 | api.ts spread order overwrote Content-Type header | Destructure headers first, then spread rest |
| fpdf2 `Character "—" outside latin-1` | Em dash in strings passed to Helvetica | `_s(text)` helper `.encode("latin-1", errors="ignore")` |
| Mock portal "Move Next" silently fails | Double quotes in onclick attribute broke HTML | Changed to single-quote onclick |
| Android status bar overlap | `edgeToEdgeEnabled: true` + wrong SafeAreaView import | SafeAreaProvider in _layout.tsx + `react-native-safe-area-context` SafeAreaView everywhere |
| Keyboard covers input on Android | `behavior={iOS-only}` | `behavior="padding"` on both platforms + `useSafeAreaInsets().bottom` |
| "complaint_id is required" on chat start | `/complaints/create` returns `_id` not `complaint_id` | Read `doc._id` not `doc.complaint_id` |
