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
                            PATCH /complaints/<id>/status  — validates against _VALID_STATUSES
                            POST /complaints/<id>/upload-doc
                              Body: { type:"signature"|"supporting", file_base64, filename, mime_type }
                              Guards: MIME allowlist (415), max 10 docs (400), max 1.2MB b64 (413)
                              Signature → complaint.signature_b64
                              Supporting → $push complaint.supporting_docs[]
                            POST /complaints/<id>/chat  — OLD agent chat (Phase 1b, still present)
routes/agent.py             POST /agent/message  — Phase 6 AI agent endpoint
                              Body: { complaint_id, message }
                              Returns: { reply, action, action_data, thinking_steps }
                              action values: null|"show_pdf"|"show_buttons"|"status_update"|
                                             "request_signature"|"request_documents"
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
                            (transcribe_audio / text_to_speech / translate stubs removed — dead code)

services/agent_runner.py    Phase 6 AI agent state machine
                            States: CHAT → SHOW_BLANK_FORM → COLLECT_FIELDS → COLLECT_DOCS → PREVIEW → SUBMITTED
                            run_agent(complaint_id, user_message, user) → dict
                            - CHAT: natural conversation, LLM decides when to ACTION: fetch_form
                            - SHOW_BLANK_FORM: shows blank PDF, waits for "fill it"
                            - COLLECT_FIELDS: LLM extracts fields via EXTRACTED: {...} at end
                            - All fields collected → ACTION: fill_form → transitions to COLLECT_DOCS
                            - COLLECT_DOCS: two sub-stages:
                                docs_stage="signature" → shows signature_request card
                                  advances when complaint.signature_b64 set OR user says "skip"
                                docs_stage="documents" → shows document_upload_request card
                                  advances when user says "done"/"finish"/"generate"/"proceed"
                                On advance: regenerates PDF with signature+docs → PREVIEW
                            - PREVIEW: shows filled PDF, waits for confirm → ACTION: submit
                            - SUBMITTED: submits to portal, updates DB, returns status_update
                            LLM output format (always ends with):
                              EXTRACTED: {"field_key": "value"}
                              ACTION: none|fetch_form|collect_fields|fill_form|submit
                            Guards: ACTION:submit outside PREVIEW → forced to fill_form first
                            _strip_think(): removes <think>...</think> AND unclosed <think> tags
                            Auto-prefills complainant_name from user.name
                            SUBCATEGORY_CONFIG: salary_not_paid (13 fields incl. nature_of_business,
                              designation, complainant_email), wrongful_termination, workplace_harassment,
                              fir_not_registered, police_misconduct, defective_product, online_scam
                            DEFAULT_CONFIG → generic fallback for any unknown subcategory

services/form_handler.py    FIELD_DEFINITIONS for old agent chat (Phase 1b)
                            get_fields, next_missing_field, build_summary, submit_to_portal
services/pdf_generator.py   generate_salary_complaint(data, signature_b64, supporting_docs) → base64 str
                              6 sections, EXIF-corrected signature embedded at declaration line,
                              Section 5 checkboxes auto-ticked from uploaded filenames,
                              image docs appended as new pages, PDF docs merged via pypdf
                            _orient_image(img_bytes) → bytes  ← Pillow EXIF rotation fix
                            _detect_doc_type(filename) → str  ← maps filename to checkbox key
                            _append_signature_and_docs(pdf_bytes, sig, docs) → bytes ← generic fallback
                            generate_pdf_b64(form_name, data, signature_b64, supporting_docs) → base64 str
                            generate_pdf(category, subcategory, data) → bytes (generic fallback)

pyproject.toml              uv deps: flask, flask-cors, pymongo, pyjwt, fpdf2,
                            python-dotenv, requests, bcrypt, sarvamai, pypdf>=4.0, pillow>=10.0
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
                                           | signature_request | document_upload_request | uploaded_file_card
                            pdf_card has label: "blank_form"|"filled_form" — blank hides Submit btn
                            Stage: loading → chatting → confirming → submitted
                            Two separate loading states:
                              thinking=true  → AI processing → ThinkingStrip shown
                              uploading=true → file uploading → inline card feedback (NOT ThinkingStrip)
                            Auto-scroll: useEffect on messages.length → scrollToEnd after 100ms
                            handleSignatureUpload() / handleSignatureSkip() / handleDocumentUpload(source)
                            / handleDocumentsDone() — upload to /complaints/<id>/upload-doc
                            handleSendRef + applyResponseRef updated every render (stale-closure guard)

components/ThinkingStrip.tsx Phase 6 redesign — Claude-like thinking display
                            Props: { visible: boolean; steps?: string[]; onDone?: () => void }
                            - visible=true: pulsing dot + cycling "Thinking.../Processing..." labels
                            - visible=false + steps: animate steps in one-by-one (350ms each)
                              with slide-in+fade-in, then hold 1.8s → call onDone
                            - phase: "loading" | "reveal" | "hidden"

components/ChatMessageRow.tsx All 8 message types rendered here (including new signature_request,
                            document_upload_request, uploaded_file_card). uploading prop disables
                            buttons and shows inline status during file upload.
components/PdfViewer.tsx    Full screen Modal. Web: iframe with data URI. Native: placeholder.
                            Props: visible, filename, pdfBase64, onClose, onApproveSubmit, onRequestChanges

constants/categories.ts     CATEGORIES with findSubcategory(subcategoryId) helper
constants/theme.ts          darkTheme, lightTheme, useTheme() hook
                            (dead backward-compat exports removed — only active exports remain)

app/pdf-viewer.tsx          Phase 7 full-screen PDF viewer route (native only)
                            Reads from utils/pdfStore.ts, writes base64→temp file via expo-file-system
                            Renders with react-native-pdf (requires dev build)
                            Header: "<category> Complaint Form" + close button
                            Bottom bar: [✏ Request Changes] [✓ Approve & Submit (green)]
                            Approve → calls pdfStore.onApprove() → router.back()
                            Request Changes → text input → pdfStore.onRequestChanges(text) → back

utils/pdfStore.ts           Module-level store for PDF data + callbacks between screens
                            setPdfViewerData / getPdfViewerData / clearPdfViewerData

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

src/services/api.ts         In-memory _token, auto Authorization header (getToken() removed — dead)
src/pages/Login.tsx         Tailwind dark/light, floating theme toggle
src/pages/Register.tsx      Language chip picker
src/pages/Dashboard.tsx     4 stat cards + case list (ProgressBar) + donut chart + notif feed
src/pages/CaseDetail.tsx    Timeline (latest first) + rejection panel + documents + form_data
src/pages/Notifications.tsx Filter tabs (All/Unread/Status Updates/Rejections) + mark-all-read
src/components/Layout.tsx   Sidebar + topbar (logo + theme toggle + avatar + sign out)
                            Fetches /notifications/mine for sidebar badge count
NOTE: CaseCard, NotificationFeed, StatCard, TimelineBar components deleted (dead code — inline in pages)

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
  agent_state: "CHAT"|"SHOW_BLANK_FORM"|"COLLECT_FIELDS"|"COLLECT_DOCS"|"PREVIEW"|"SUBMITTED"|"REJECTED",
  agent_history: Array,      // [{role, content}] last 40 messages for LLM context
  signature_b64: String|null,     // handwritten signature (base64)
  supporting_docs: Array,         // [{filename, file_b64, mime_type}]
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
PATCH /complaints/<id>/status           { status }  (validated against _VALID_STATUSES)
POST /complaints/<id>/upload-doc        { type, file_base64, filename, mime_type }
```

### Forms / Notifications / Users / Webhook
```
GET  /forms/<form_name>           → blank PDF from portal
POST /forms/generate              { form_name, form_data } → { pdf_base64 }
GET  /notifications/mine          → unread (add ?all=1 for all)
POST /notifications/read/<id>     → mark read
POST /notifications/read/all      → mark all read
POST /users/push_token            { token }
POST /webhooks/portal             (called by mock portal — no JWT auth)
```

### salary_not_paid fields (generate_salary_complaint)
```
complainant_name, complainant_address, complainant_phone, complainant_email,
employer_name, employer_address, nature_of_business, employment_start_date,
designation, last_paid_date, months_pending, amount_pending, attempts_made
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

## Agent Design (Phase 6+9 — IMPLEMENTED)

Natural conversation → understand problem → blank form → collect fields → signature + docs → filled PDF → submit.

```
CHAT            Natural conversation in user's language. LLM outputs ACTION: fetch_form when ready.
SHOW_BLANK_FORM Blank PDF from GET /portal/forms/salary_complaint shown in chat.
                User says "fill it" → LLM outputs ACTION: collect_fields
COLLECT_FIELDS  LLM collects fields via EXTRACTED: {...} pattern. Auto-fills complainant_name.
                When all fields present → Python transitions to COLLECT_DOCS
COLLECT_DOCS    Sub-stage 1 (signature): signature_request card shown.
                  → advance when complaint.signature_b64 set OR user says "skip"
                Sub-stage 2 (documents): document_upload_request card shown.
                  → advance when user says "done"/"finish"/"generate"/"proceed"
                → PDF regenerated with signature+docs → transitions to PREVIEW
PREVIEW         Filled PDF shown in chat. User confirms → LLM outputs ACTION: submit
SUBMITTED       Python calls portal, updates DB, returns action:"status_update"
```

LLM always ends response with two lines:
```
EXTRACTED: {"field_key": "value_from_user_message"}
ACTION: none|fetch_form|collect_fields|fill_form|submit
```

Language: `user.preferred_language` → LANG_NAMES dict → system prompt says "Respond ONLY in {language}".
Initial greeting is hardcoded (no LLM call) for en/hi/ta/te/kn/ml — uses cfg["title"] + cfg["authority"].

### Dynamic subcategory config (SUBCATEGORY_CONFIG in agent_runner.py)
Each subcategory has: title, authority, issue, form_name, fields list.
Greeting, system prompt, field collection, PDF filename, portal upload authority
are all driven by this config — adding a new complaint type only requires a new entry.

Supported subcategories:
| subcategory          | title                  | authority                          |
|----------------------|------------------------|------------------------------------|
| salary_not_paid      | Salary Non-Payment     | Labour Commissioner                |
| wrongful_termination | Wrongful Termination   | Labour Commissioner                |
| workplace_harassment | Workplace Harassment   | Labour Commissioner / ICC          |
| fir_not_registered   | FIR Not Registered     | Superintendent of Police           |
| police_misconduct    | Police Misconduct      | SP / State Human Rights Commission |
| defective_product    | Defective Product      | Consumer Disputes Redressal Forum  |
| online_scam          | Online Scam/Cyber Fraud| Cyber Crime Cell                   |
| (any other)          | Complaint (generic)    | Relevant Authority                 |

### Sarvam think-tag stripping
sarvam-m emits `<think>...</think>` chain-of-thought. `_strip_think()` handles:
- Closed tags → take text after last `</think>`
- Unclosed `<think>` → strip the tag, keep remaining text
Always strip BEFORE parsing EXTRACTED/ACTION and before returning reply to client.
Also pass `reasoning_effort=None` in SDK call to suppress CoT at model level.

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
- [x] **Phase 7** — PDF Form Fill + In-App Viewer (native react-native-pdf, requires dev build)
- [x] **Phase 8** — Notifications Loop (Expo push + polling fallback + in-app banner + drawer)
- [x] **Phase 9** — Signature + document upload flow; PDF embedding; code review fixes; dead code cleanup
- [ ] **Phase 10** — Polish — Multilingual UI labels, final animations
- [ ] **Phase 11** — Demo Prep + Final Wiring

### Next task: Phase 10
Polish — multilingual UI labels, final animations.

### Phase 8 notes
- Push via Expo Push API from backend (webhooks.py `_send_expo_push` with `data` dict)
- `data` payload: `{ type, complaint_id, status, next_step_label, reason }`
- `sound: "default"` added so device plays sound on notification
- Backend: `GET /notifications/mine?all=1` returns all (read+unread); default still unread only
- Backend: `POST /notifications/read/all` marks all notifications read
- Mobile services: `mobile/services/notifications.ts`
  - `registerForPushNotifications()` — permissions + token + POST /users/push_token
  - `addForegroundListener(cb)` — fires when push arrives while app is open
  - `addResponseListener(cb)` — fires when user taps background push
  - `Notifications.setNotificationHandler` set so banner is suppressed (we show InAppBanner)
- Mobile context: `mobile/context/NotificationContext.tsx`
  - `useNotifications()` — provides `notifications`, `unreadCount`, `refreshNotifications`, `markRead`, `markAllRead`
  - Polls `/notifications/mine?all=1` every 30s
- `mobile/components/InAppBanner.tsx` — slides down from top, 4s auto-dismiss, spring animation
- `mobile/components/NotificationDrawer.tsx` — right-side drawer, unread highlighted, time-ago, typeIcon
- `mobile/app/_layout.tsx` — wraps with `NotificationProvider`, handles push setup + foreground banner
- `mobile/app/(tabs)/index.tsx` — bell now opens `NotificationDrawer`, badge from context
- `mobile/app/chat/[category].tsx`:
  - Polling fallback every 10s via `GET /complaints/<id>` — inserts status_update card on change
  - Calls `refreshNotifications()` when status_update received from agent or polling

### Phase 7 notes
- PDF viewer screen: `mobile/app/pdf-viewer.tsx` (expo-file-system + react-native-pdf)
  - Reads PDF data from `mobile/utils/pdfStore.ts` (module-level store, no URL-param size limits)
  - Requires dev build (`npx expo run:android` or `npx expo run:ios`)
  - Graceful fallback if react-native-pdf not available
- Resubmission flow:
  - Webhook sets `agent_state = "REJECTED"` + `rejection_reason` when portal returns FAIL
  - Chat screen polls GET /complaints/<id> every 8s when stage="submitted"
  - On detecting REJECTED, sends empty message to agent
  - Agent (REJECTED state) calls LLM to auto-correct form_data, regenerates PDF, shows new PdfCard
  - User approves → resubmit (same portal endpoint, resubmission_count incremented)
- `generate_salary_complaint(form_data) -> str (base64)` — new professional A4 form
  - Header: logo placeholder, centred title/subtitle, ref no + date top-right
  - 6 sections: Complainant, Employer, Employment, Steps Taken (checkboxes), Documents (checkboxes), Declaration
  - Now used by `generate_pdf_b64()` for all salary forms

### Phase 9 notes
- New agent state: `COLLECT_DOCS` (between COLLECT_FIELDS and PREVIEW)
  - Two sub-stages gated on DB state: `docs_stage="signature"` then `docs_stage="documents"`
  - Server guards prevent LLM from bypassing the state
- New endpoint: `POST /complaints/<id>/upload-doc`
  - Server-side MIME allowlist, 10-doc cap, 1.2MB size limit
  - Signature → `complaint.signature_b64`; docs → `complaint.supporting_docs[]`
- PDF changes: `generate_salary_complaint(data, signature_b64, supporting_docs)`
  - EXIF-corrected signature embedded at declaration line (size-guarded at 1.2MB)
  - Section 5 checkboxes auto-ticked from uploaded filenames (`_detect_doc_type`)
  - Image docs appended as pages; PDF docs merged via pypdf
  - `_append_signature_and_docs()` for non-salary form fallback
  - New deps: `pypdf>=4.0`, `pillow>=10.0`
- Mobile: separated `uploading` state from `thinking` — different UX for file upload vs AI processing
- Code review fixes: `debug=False` in prod, WEBHOOK_SECRET startup warning,
  status PATCH validated against allowlist, `cancelled` flag in polling hook,
  `__DEV__` logging in upload catch blocks
- Dead code removed: AgentMessage.tsx, PdfCard.tsx, agentSteps.ts, web CaseCard/NotificationFeed/
  StatCard/TimelineBar, sarvam.py stubs, theme.ts backward-compat exports, web api.ts getToken()
- Documentation: `CivicFlow_Technical_Documentation.docx` generated at civicflow root
  (script: `generate_docs.py`, run: `uv run --with python-docx python generate_docs.py`)

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
| Sarvam "First message must be from user" | Initial greeting stored as `assistant` in history; Sarvam rejects non-user first message | Don't store greeting in agent_history; strip leading assistant msgs before every LLM call |
| `<think>` tags showing in chat UI | sarvam-m emits unclosed `<think>` blocks without `</think>` — regex `<think>.*?</think>` never matched | `_strip_think()`: if `</think>` present take text after it; else strip all `<think>` tags |
| `.env` key loaded with quotes (`"sk_..."`) | Key pasted with surrounding quotes in `.env.example`, copied as-is | Remove quotes — dotenv value should be bare: `SARVAM_API_KEY=sk_...` |
| `.env` file missing | Only `.env.example` existed; `load_dotenv()` reads `.env` not `.env.example` | Copy: `cp .env.example .env` |
| All subcategories show salary greeting | Greeting and fields hardcoded for salary_not_paid only | Added `SUBCATEGORY_CONFIG` dict; agent loads `subcategory` from complaint doc and uses matching config |
| Upload buttons missing in UI | `onSignatureUpload` etc. declared in TypeScript interface but never destructured | Added all 4 callbacks to destructuring in ChatMessageRow |
| Agent skips COLLECT_DOCS/PREVIEW | LLM outputs `ACTION: submit` directly from COLLECT_FIELDS | Server-side guard: `if llm_action=="submit" and state!="PREVIEW": llm_action="fill_form"` |
| Thinking strip shows during file upload | `setThinking(true)` called before picker opens | Separated `uploading` state from `thinking`; picker opens before `setUploading(true)` |
| Signature rotated 90° in PDF | Phone EXIF orientation tag ignored by fpdf2 | `_orient_image()` using `PIL.ImageOps.exif_transpose()` |
| PREVIEW state ignores field corrections | Extracted values not applied when `state == "PREVIEW"` | `if val and (key in valid_keys or state == "PREVIEW")` |
| `nature_of_business`/`designation` missing from form | Fields rendered in PDF but never collected by agent | Added both to `salary_not_paid` fields in `SUBCATEGORY_CONFIG` |
| `clearInterval` inside async callback | Race condition: cancelled effect still fires state updates | Added `cancelled` flag; interval cleanup: `return () => { cancelled=true; clearInterval(interval) }` |
