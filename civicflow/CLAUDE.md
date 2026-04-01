# Nivedan — Project Memory (v2.1 — Deployment Ready)

> Read this first. Update at end of each session. Read only files you're about to edit.

---

## What This App Does

**Nivedan** helps Indian citizens file government complaints in their own language.

**Mobile flow:** Pick category → AI (Sarvam) conversation → blank form shown → collect fields → signature + docs → filled PDF → submit to portal → push notification on status change.

Target users: low-literacy, vernacular-language speakers.
Languages: Hindi, Tamil, Telugu, Kannada, Malayalam, English — via Sarvam AI (`sarvam-m`).

---

## Start Commands

```bash
cd civicflow/backend    && uv run python app.py        # port 5000
cd civicflow/mock_portal && uv run python portal_app.py # port 5001
cd civicflow/web        && npm run dev                  # port 5173
cd civicflow/mobile     && npx expo start --clear       # scan QR / press a/i/w
```

MongoDB must be running: `mongod` or MongoDB Compass.

---

## Environment

### `backend/.env`
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
> Wi-Fi IP changes → update this → `npx expo start --clear`. Get IP: `ipconfig` → Wi-Fi IPv4.

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Mobile | React Native + Expo SDK 54 | expo-router file-based routing |
| Web | React 18 + Vite + TypeScript | react-router-dom |
| Backend | Flask 3 + flask-cors | **uv only — never pip** |
| Mock Portal | Flask 3 | Port 5001, separate process |
| Database | MongoDB | Raw pymongo — **no ORM** |
| AI | Sarvam AI (`sarvamai` SDK) | Model: `sarvam-m` |
| Auth | JWT (pyjwt) | HS256, 30-day expiry, same secret for mobile + web |
| PDF | fpdf2 | Server-side only |
| Python deps | uv | `uv add <pkg>`, `uv sync`, `uv run python` |
| JS deps | npm | |
| Three.js | three@0.183, @react-three/fiber@9.5, @react-three/drei@10.7 | Web landing only |

---

## File Map

### Backend (`civicflow/backend/`)

```
app.py                    Entry — load_dotenv() FIRST, host="0.0.0.0", registers all blueprints

routes/auth.py            POST /auth/register, POST /auth/login, GET /auth/me
routes/complaints.py      POST   /complaints/create              → full doc (use ._id!)
                          GET    /complaints/  |  /complaints/mine  |  /complaints/<id>
                          POST   /complaints/<id>/submit_to_portal | /resubmit
                          PATCH  /complaints/<id>/status          (validated allowlist)
                          POST   /complaints/<id>/upload-doc
                            { type:"signature"|"supporting", file_base64, filename, mime_type }
                            Guards: MIME allowlist, max 10 docs, max 1.2MB
routes/agent.py           POST /agent/message  { complaint_id, message }
                            → { reply, action, action_data, thinking_steps }
                            action: null|"show_pdf"|"show_buttons"|"status_update"|
                                    "request_signature"|"request_documents"
routes/forms.py           GET /forms/<name> → blank PDF proxy | POST /forms/generate → pdf_base64
routes/notifications.py   GET /notifications/mine  |  POST /notifications/read/<id>
routes/users.py           POST /users/push_token
routes/webhooks.py        POST /webhooks/portal  (no JWT — called by mock portal)

db.py                     MongoDB connection — import `db` from here everywhere
models/user.py            user_schema(name, email, phone, password_hash, preferred_language)
models/complaint.py       complaint_schema(user_id, category, subcategory, form_data, title)

services/auth_middleware.py  @jwt_required → sets flask.g.user = full user doc
services/sarvam.py           chat_completion(messages, system_prompt) → str
                               client = SarvamAI(api_subscription_key=KEY)
                               response.choices[0].message.content or ""
services/agent_runner.py     Agent state machine:
                               CHAT → SHOW_BLANK_FORM → COLLECT_FIELDS → COLLECT_DOCS → PREVIEW → SUBMITTED
                               COLLECT_DOCS sub-stages: signature → documents
                               LLM always ends reply with:
                                 EXTRACTED: {"field": "value"}
                                 ACTION: none|fetch_form|collect_fields|fill_form|submit
                               Guard: ACTION:submit outside PREVIEW → forced to fill_form
                               _strip_think() strips <think>...</think> and unclosed tags
                               SUBCATEGORY_CONFIG: salary_not_paid, wrongful_termination,
                                 workplace_harassment, fir_not_registered, police_misconduct,
                                 defective_product, online_scam + DEFAULT_CONFIG fallback
services/pdf_generator.py    generate_salary_complaint(data, signature_b64, supporting_docs) → b64
                               6 sections, EXIF-corrected signature, checkboxes auto-ticked,
                               image docs appended, PDF docs merged via pypdf
                             generate_pdf_b64(form_name, data, sig, docs) → b64

pyproject.toml            uv deps: flask, flask-cors, pymongo, pyjwt, fpdf2,
                          python-dotenv, requests, bcrypt, sarvamai, pypdf>=4.0, pillow>=10.0
```

### Mock Portal (`civicflow/mock_portal/`)

```
portal_app.py             Flask, port 5001, civicflow_portal DB
                          GET  /portal/dashboard  |  POST /portal/submit
                          GET  /portal/submissions  |  POST /portal/action (fires webhook)
                          GET  /portal/pdf/<ref>  |  GET /portal/forms/salary_complaint
templates/dashboard.html  Dark UI, auto-refresh 15s, approve/fail buttons
```

### Mobile (`civicflow/mobile/`)

```
app/_layout.tsx           Root — SafeAreaProvider > AuthProvider > Stack
                          Auth guard: no user → /auth/login | logged in + auth/* → /(tabs)
app/auth/login.tsx        Login screen
app/auth/register.tsx     Register + language chip picker (6 languages)
app/(tabs)/index.tsx      Home — category grid + subcategory bottom sheet → /chat/<subcategory>
app/(tabs)/dashboard.tsx  My Cases — complaint list + pull-to-refresh
app/(tabs)/profile.tsx    User info + sign out
app/chat/[category].tsx   AI agent chat — param is SUBCATEGORY ID (e.g. salary_not_paid)
                          Flow: POST /complaints/create → doc._id
                                POST /agent/message { complaint_id: doc._id, message: "" } → greeting
                                Each turn: POST /agent/message { complaint_id, message }
                          Message types: user|agent|action_buttons|status_update|pdf_card|
                                         signature_request|document_upload_request|uploaded_file_card
                          Two loading states: thinking (AI) vs uploading (file) — separate UX
app/pdf-viewer.tsx        Native PDF viewer (expo-file-system + react-native-pdf, needs dev build)
                          Reads from utils/pdfStore.ts

components/ThinkingStrip.tsx  Pulsing dot while AI thinks; reveals steps one-by-one on done
components/ChatMessageRow.tsx All 8 message types. uploading prop disables buttons.
components/PdfViewer.tsx      Modal — web: iframe data URI; native: placeholder
components/InAppBanner.tsx    Push notification banner (slides from top, 4s auto-dismiss)
components/NotificationDrawer.tsx Right-side drawer, unread highlighted

context/AuthContext.tsx   AuthProvider, useAuth()
context/NotificationContext.tsx  useNotifications() — polls /notifications/mine?all=1 every 30s
constants/categories.ts   CATEGORIES + findSubcategory(id)
constants/theme.ts        darkTheme, lightTheme, useTheme()
services/api.ts           api.get/post/authedGet/authedPost/authedPatch
services/agent.ts         sendAgentMessage(complaintId, message) → AgentResponse
services/auth.ts          loginUser, registerUser, storeToken, getToken, logout
services/notifications.ts registerForPushNotifications, addForegroundListener, addResponseListener
utils/storage.ts          Platform-aware: web→localStorage, native→expo-secure-store
utils/pdfStore.ts         Module-level store for PDF data + callbacks between screens
```

### Web (`civicflow/web/`)

```
src/main.tsx              Entry — ThemeProvider > AuthProvider > BrowserRouter > Routes
                          PrivateRoute: /dashboard, /cases/:id, /notifications
                          Routes: / → Landing | /login | /register | /dashboard | /cases/:id | /notifications

src/pages/Landing.tsx     Public marketing page
                          Architecture: fixed 3D canvas (z:1) + fixed content overlay (z:5)
                            + scroll dots (z:50) + 700vh scroll spacer + CTA + Footer
                          TOTAL_SECTIONS=7 (0=hero, 1–6=features)
                          Section driven by window scroll; content fades with 260ms cross-fade
                          Color: white / navy #1B2A4A / saffron #E8891A
                          Font: Google Sans Flex + JetBrains Mono
                          Footer: © 2026 Nivedan. All rights reserved.

src/components/landing/
  Navbar.tsx              Frosted glass, navy text, LOGO.png top-left
  PhoneScene.tsx          R3F Canvas (alpha, dpr:[1,2]) + lighting + ContactShadows
  PhoneModel.tsx          3D phone using GLB model (public/PhoneModel3D.glb)
                          SCREENSHOTS: PlaneGeometry overlay positioned at GLB front face
                            - Size computed from model bounding box (~84% H, ~82% W)
                            - Textures from public/screenshots/s0.png … s6.png
                            - Cover-fit via texture.repeat/offset
                            - Swaps at midpoint of slide animation (slideProgress ≥ 0.5)
                          INTRO ANIMATION on load:
                            - 2 full Y rotations (4π) → ease-out quart → settles front-facing
                            - Duration: 2.4s. Drag blocked during intro.
                          SECTION SLIDE: smoothstep lerp fromX→toX, no rotation
                            TARGET_X = [1.5, 1.5, -1.5, 1.5, -1.5, 1.5, -1.5]
                          DRAG: userRotY/X ± clamp, momentum 0.88×/frame, spring-back lerp 0.05
                          PARALLAX: mouse tilt ±0.12Y / ±0.07X when idle
  ScrollDots.tsx          6 dots (sections 1–6), active = saffron pill

src/pages/Login.tsx       Split-screen: form (card box) left + floating illustration right; purple accent; Plus Jakarta Sans body, no slide animation
src/pages/Register.tsx    Same split-screen pattern; Times New Roman only below image (removed); language chips purple
src/pages/Dashboard.tsx   3-col layout: complaints | chart+notifs | vertical carousel (image+text); SVG icons, no emojis; purple accent
src/pages/CaseDetail.tsx  Timeline + rejection panel + documents + form_data
src/pages/Notifications.tsx Filter tabs + mark-all-read
src/pages/Profile.tsx     NEW — hero card (purple→violet gradient matching mobile), lang chips, account info rows, theme toggle, sign out
src/components/Layout.tsx Sidebar (Dashboard, Notifications, Profile) + topbar with LOGO.png; white default bg

src/assets/LOGO.png       App logo (also at public/LOGO.png)
public/icon.ico           Favicon
public/PhoneModel3D.glb   3D iPhone GLB model
public/screenshots/       s0.png … s6.png — app screenshots shown on 3D phone screen
public/LoginPagePhoto.png public/RegisterPagePhoto.png  public/CarouselImage1-4.png

Fonts: Plus Jakarta Sans (Google Fonts) — body; Times New Roman — image captions only
Packages: react-icons, Recharts, Three.js stack
Tailwind: CDN in index.html, darkMode: 'class', default light (white)
```

---

## MongoDB

| DB | Collections |
|----|-------------|
| `civicflow` | `users`, `complaints`, `notifications` |
| `civicflow_portal` | `portal_submissions` |

**Wipe for clean test:**
```js
use civicflow; db.complaints.deleteMany({}); db.notifications.deleteMany({})
use civicflow_portal; db.portal_submissions.deleteMany({})
```

**complaints doc key fields:**
```
status: pending|filed|acknowledged|under_review|next_step|resolved|failed
agent_state: CHAT|SHOW_BLANK_FORM|COLLECT_FIELDS|COLLECT_DOCS|PREVIEW|SUBMITTED|REJECTED
signature_b64, supporting_docs[], portal_ref_id, rejection_reason, timeline[], form_data{}
```

---

## API Contract

```
POST /auth/register   { name, email, password, phone, preferred_language }
POST /auth/login      { email, password }
GET  /auth/me         → { id, name, email, preferred_language }

POST /agent/message   jwt  { complaint_id, message }
  → { reply, action, action_data: { filename?, pdf_base64?, label?, buttons?, status? }, thinking_steps[] }
  Send message="" for initial greeting

POST /complaints/create  { category, subcategory, form_data } → full doc (read ._id NOT .complaint_id)
POST /complaints/<id>/upload-doc  { type:"signature"|"supporting", file_base64, filename, mime_type }
PATCH /complaints/<id>/status     { status }

GET  /notifications/mine?all=1   POST /notifications/read/all
POST /users/push_token  { token }
POST /webhooks/portal   (no JWT)
```

---

## Key Patterns

### Backend route
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

### Mobile agent call
```typescript
const greet = await sendAgentMessage(doc._id, "");          // greeting
const res   = await sendAgentMessage(complaintId, userText); // user turn
// res.action: null | "show_pdf" | "show_buttons" | "status_update"
```

### Sarvam AI
```python
from sarvamai import SarvamAI
client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
response = client.chat.completions(messages=[...], model="sarvam-m")
text = response.choices[0].message.content or ""
```

---

## Key Rules

1. **uv only** — `uv add pkg`, `uv sync`, `uv run python`. Never `pip`.
2. **No ORM** — raw pymongo only.
3. **load_dotenv() first** — before any imports in `app.py`.
4. **JWT same everywhere** — same secret + HS256 for mobile, web, backend.
5. **expo-secure-store** — named imports only + `utils/storage.ts`. Never `import * as SecureStore`.
6. **PDF server-side only** — fpdf2, never on client.
7. **No Redux/Zustand** — local state + context only.
8. **Flask host 0.0.0.0** — required for mobile on LAN.
9. **complaint._id** — `/complaints/create` returns `_id`. Never use `.complaint_id`.
10. **CORS open in dev** — `CORS(app, methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"])` — DELETE must be explicit.
11. **Global JSON errors** — `app.py` has `@app.errorhandler` for 400/401/403/404/405/409/500 returning JSON, never HTML.
12. **Delete complaint** — `$or` query matches both ObjectId and legacy string `user_id` formats.

---

## Version

**v2.1 — Deployment Ready** (2026-03-22)

## Phases

- [x] Phase 0–9 — Complete (scaffold, auth, portal, agent, PDF, viewer, notifications, sig+docs)
- [x] **Phase 10** — Polish: multilingual UI labels, final animations ✓ complete
- [x] **Phase 11** — Web UI overhaul + bug fixes ✓ complete ← **current**

### Phase 10 — Completed

#### Web landing
- Replaced custom RoundedBox phone with real GLB model (`PhoneModel3D.glb`)
- App screenshots render on phone screen via plane overlay (section-driven, cover-fit)
- On-load intro animation: 2 full Y rotations → ease-out settle (2.4s)
- Section transitions: smooth X slide only (no rotation)
- Footer year updated to 2026

#### Mobile UI polish
- **Safe area fix**: Tab bar no longer overlaps home indicator — uses `useSafeAreaInsets().bottom`
- **Dark/light theme toggle**: Switch in profile page; persisted via `loadPersistedTheme()` (was imported but never called — now fixed in `app/_layout.tsx` useEffect)
- **Hamburger drawer**: Left-side slide-in panel (260ms, 300px) shows user info + up to 5 recent cases with status chips; overlay fades to 0.5 opacity
- **Assistant tab hidden**: `href: null` on Tabs.Screen — route still accessible via `/chat/*`
- **Google Sans Flex**: Infrastructure added in `app/_layout.tsx` with `ENABLE_GOOGLE_SANS=false` flag; set to `true` once TTF placed at `assets/fonts/GoogleSansFlex.ttf`
- **Delete pending complaints**: Trash button shown only on `status==="pending"` cards in dashboard; backend DELETE endpoint with owner + status guards
- **Labor issues icon**: Changed from `scale-outline` → `briefcase-outline`
- **Hand emoji removed** from home screen greeting row

#### Multilingual UI (`mobile/constants/i18n.ts`)
- 6 languages: English, Hindi, Telugu, Tamil, Kannada, Malayalam
- ~50 string keys covering all app UI, status labels, category/subcategory names
- Module-level pub/sub store (same pattern as `theme.ts`) — `setLanguage()` triggers instant re-render everywhere
- `loadPersistedLanguage()` called at app root alongside `loadPersistedTheme()`
- Language picker: inline chip grid always visible in profile page (no hidden bottom sheet)
- `PATCH /auth/me` backend endpoint syncs `preferred_language` on language change
- Subcategory labels translated in all 6 languages via `t('sub_<id>')` keys
- Chat language handled separately by Sarvam AI using user's `preferred_language`

#### Backend additions (Phase 10)
- `DELETE /complaints/<id>` — owner-only, pending-only guard, `db.complaints.delete_one`
- `PATCH /auth/me` — updates `preferred_language` with supported-language validation

---

### Phase 11 — Completed (v2.1)

#### Branding
- App renamed **Nivedan** across all surfaces (was CivicFlow)
- `public/LOGO.png` used in web topbar, login, register cards
- `public/icon.ico` used as browser favicon; title = "Nivedan"
- Mobile version string updated to `2.1`

#### Web UI overhaul
- **Login/Register**: split-screen layout, floating illustration (CSS `@keyframes float`), card box around form, purple-600 buttons, light-mode default
- **Dashboard**: 3-column layout (complaints | chart+notifs | vertical carousel); SVG icons replace all emojis; purple accent
- **Profile page**: created from scratch — purple→violet gradient hero card (matches mobile screenshot), language chips, account info rows, theme toggle switch, sign-out button; route `/profile` added to `main.tsx`
- **ThemeContext**: default changed to `light` (white); dark on toggle
- **Fonts**: Plus Jakarta Sans (Google Fonts CDN) as body font; Times New Roman for image captions only
- **Layout**: `bg-white` default; `LOGO.png` in topbar; sidebar nav fixed (Profile route was missing)

#### Mobile fixes (Phase 11)
- **Profile hero card**: `LinearGradient` from `expo-linear-gradient` — `#5B4EC9 → #9B72E8` left-to-right; translucent avatar circle `rgba(255,255,255,0.22)`; outlined "TEAM NIVEDAN" pill
- **Hamburger drawer real-time**: `useFocusEffect` + refresh on `openMenu` — recent cases always reflect deletions immediately
- **Delete bug fixed**: backend uses `$or` for ObjectId+string user_id; global JSON error handlers prevent HTML 500 responses; mobile shows actual server error instead of generic fallback
Add under a ## Workflow Rules section at the top of CLAUDE.md\n\nAfter making significant changes or completing a project phase, always update CLAUDE.md and related documentation without being asked.
Add under a ## UI/Design Guidelines section\n\nWhen working on UI/design tasks, confirm the exact visual reference (light/dark mode, icon library, color scheme) before making bulk changes. Show a summary of planned changes first.
Add under a ## General Rules section\n\nAlways check for existing config files (.mcp.json, .env, settings.json) in the project before asking the user or making assumptions about configuration.
Add under a ## Testing & Analysis section\n\nWhen running code analysis tools (vulture, linters, tests), exclude virtual environments (.venv, node_modules) and build directories by default.
Add under a ## Platform Notes section\n\nFor Windows development: handle Unicode/encoding issues proactively (use cp1252-safe characters), use os.path for path resolution, and account for Windows-specific quirks (Qt threading, ffmpeg dependencies).
