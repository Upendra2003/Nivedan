"""
CivicFlow AI Agent — Phase 6
Flow: CHAT → SHOW_BLANK_FORM → COLLECT_FIELDS → PREVIEW → SUBMITTED
"""
import json
import re
import os
import base64
import requests
from datetime import datetime, timezone
from bson import ObjectId
from db import db
from services.sarvam import chat_completion
from services.pdf_generator import generate_pdf_b64

MOCK_PORTAL_URL = os.getenv("MOCK_PORTAL_URL", "http://localhost:5001")

# ── Language map ──────────────────────────────────────────────────────────────

LANG_NAMES = {
    "en": "English", "hi": "Hindi (हिन्दी)",
    "ta": "Tamil (தமிழ்)", "te": "Telugu (తెలుగు)",
    "kn": "Kannada (ಕನ್ನಡ)", "ml": "Malayalam (മലയാളം)",
    "bn": "Bengali (বাংলা)", "mr": "Marathi (मराठी)",
    "gu": "Gujarati (ગુજરાતી)", "pa": "Punjabi (ਪੰਜਾਬੀ)",
}

# ── Required fields for salary complaint ─────────────────────────────────────

FIELDS = [
    ("complainant_name",      "your full name"),
    ("employer_name",         "your employer / company name"),
    ("employer_address",      "your employer's full address"),
    ("employment_start_date", "date you started working"),
    ("last_paid_date",        "last date salary was paid"),
    ("months_pending",        "number of months salary is unpaid"),
    ("amount_pending",        "total unpaid amount in rupees"),
    ("attempts_made",         "steps you already took to resolve this"),
]

# ── Agent states ──────────────────────────────────────────────────────────────
# CHAT            → understand problem, free conversation
# SHOW_BLANK_FORM → blank form shown to user
# COLLECT_FIELDS  → collecting required fields one at a time
# PREVIEW         → filled PDF shown, awaiting confirmation
# SUBMITTED       → done


def _missing(form_data: dict) -> list:
    return [f for f in FIELDS if not form_data.get(f[0])]


def _lang(user: dict) -> str:
    code = user.get("preferred_language", "en") or "en"
    return LANG_NAMES.get(code, "English")


def _system_prompt(state: str, form_data: dict, user_name: str, language: str) -> str:
    missing = _missing(form_data)
    collected_str = (
        "\n".join(f"  {k}: {v}" for k, v in form_data.items())
        if form_data else "  (none yet)"
    )
    missing_str = ", ".join(f[0] for f in missing) if missing else "none — all collected"

    return f"""You are CivicFlow, a compassionate AI legal assistant helping Indian citizens file government complaints.

CRITICAL: Respond ONLY in {language}. Do not use any other language.

User's name: {user_name}
Current state: {state}
Collected info: \n{collected_str}
Still needed: {missing_str}

## Your behavior by state:

### CHAT state
- Understand the user's salary problem through warm, natural conversation
- Ask clarifying questions naturally (don't ask all at once)
- When you have enough context OR user says "file complaint" / "help me file" / similar intent:
  → output ACTION: fetch_form

### SHOW_BLANK_FORM state
- You just showed the user the blank government form
- Explain what information is needed to fill it
- When user says "fill it" / "yes fill" / "haan baro" / similar:
  → output ACTION: collect_fields

### COLLECT_FIELDS state
- Collect missing fields one at a time, naturally (not robotically)
- Pre-fill complainant_name as "{user_name}" if not yet set
- Extract any values from user's message and list them in EXTRACTED
- When ALL fields collected:
  → output ACTION: fill_form

### PREVIEW state
- You just showed the user the filled complaint PDF
- Ask them to review and confirm: "Does everything look correct? Shall I submit this?"
- If user confirms (yes/submit/haan):
  → output ACTION: submit
- If user wants changes:
  → output ACTION: collect_fields

## Output format (ALWAYS end with these two lines, no matter what):
EXTRACTED: {{"field_key": "value"}}
ACTION: none|fetch_form|collect_fields|fill_form|submit

## Rules:
- **ONE question per reply. Never ask two questions in the same message. Period.**
- Keep replies short — 1 acknowledgement sentence + 1 question only
- Be warm and patient — users are distressed, give them space
- Never mention "EXTRACTED" or "ACTION" in your visible reply
- Use ACTION: none for most conversational turns
- Do NOT list multiple things to provide. Ask for ONE thing, wait for answer, then ask next."""


def _strip_think(text: str) -> str:
    """
    Remove Sarvam-m chain-of-thought blocks.
    Handles both closed (<think>...</think>) and unclosed (<think>...) tags.
    """
    # Case 1: properly closed tag — take content AFTER the last </think>
    if '</think>' in text:
        text = text.split('</think>')[-1].strip()
    # Case 2: unclosed <think> tag — strip all <think> / </think> tags themselves
    # but keep the text that follows (the model put its response inside the block)
    text = re.sub(r'</?think>', '', text).strip()
    return text


def _parse_tail(llm_text: str) -> tuple[dict, str]:
    """Extract EXTRACTED dict and ACTION from end of LLM response. Returns (extracted, action, clean_reply)."""
    # Strip chain-of-thought blocks first
    text = _strip_think(llm_text)

    extracted = {}
    action = "none"

    # EXTRACTED line
    m = re.search(r'EXTRACTED:\s*(\{[^}]*\})', text, re.DOTALL)
    if m:
        try:
            extracted = json.loads(m.group(1))
        except Exception:
            pass

    # ACTION line
    m2 = re.search(r'ACTION:\s*(\w+)', text)
    if m2:
        action = m2.group(1).lower().strip()

    # Clean reply — remove EXTRACTED/ACTION lines
    clean = re.sub(r'\nEXTRACTED:.*', '', text, flags=re.DOTALL)
    clean = re.sub(r'\nACTION:.*', '', clean, flags=re.DOTALL).strip()
    return extracted, action, clean


def _fetch_blank_form_b64() -> str | None:
    """Fetch blank salary form PDF from mock portal, return base64."""
    try:
        portal_url = os.getenv("MOCK_PORTAL_URL", "http://localhost:5001")
        resp = requests.get(f"{portal_url}/portal/forms/salary_complaint", timeout=5)
        if resp.status_code == 200:
            return base64.b64encode(resp.content).decode()
    except Exception:
        pass
    return None


def _submit_to_portal(complaint_id: str, user: dict, form_data: dict) -> dict:
    pdf_data = {**form_data, "declaration_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
    pdf_base64 = generate_pdf_b64("salary_non_payment", pdf_data)
    resp = requests.post(
        f"{MOCK_PORTAL_URL}/portal/submit",
        json={
            "complaint_id": complaint_id,
            "user_id": str(user["_id"]),
            "category": "Labor Issues",
            "form_data": form_data,
            "pdf_base64": pdf_base64,
        },
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


# ── Main entry ────────────────────────────────────────────────────────────────

def run_agent(complaint_id: str, user_message: str, user: dict) -> dict:
    """
    One agent turn.
    Returns: { reply, action, action_data, thinking_steps }
    """
    cid        = ObjectId(complaint_id)
    complaint  = db.complaints.find_one({"_id": cid, "user_id": user["_id"]})
    if not complaint:
        return _err("Complaint not found.")

    form_data     = dict(complaint.get("form_data") or {})
    state         = complaint.get("agent_state", "CHAT")
    history       = list(complaint.get("agent_history") or [])
    language      = _lang(user)
    user_name     = user.get("name", "")

    # ── Auto-prefill user's own name ──────────────────────────────────────────
    if user_name and not form_data.get("complainant_name"):
        form_data["complainant_name"] = user_name

    # ── CHAT + empty message = initial greeting (no LLM call needed) ─────────
    if state == "CHAT" and not user_message:
        lang_code = user.get("preferred_language", "en") or "en"
        greet_map = {
            "hi": f"नमस्ते {user_name}! मैं CivicFlow AI हूँ। मैं आपकी वेतन न मिलने की शिकायत दर्ज करने में मदद करूँगा। कृपया मुझे बताएं — आपके साथ क्या हुआ?",
            "ta": f"வணக்கம் {user_name}! நான் CivicFlow AI. உங்கள் சம்பள புகாரில் உதவுவேன். என்ன நடந்தது?",
            "te": f"నమస్కారం {user_name}! నేను CivicFlow AI. మీ జీతం సమస్యలో సహాయం చేస్తాను. ఏమి జరిగింది?",
            "kn": f"ನಮಸ್ಕಾರ {user_name}! ನಾನು CivicFlow AI. ನಿಮ್ಮ ವೇತನ ದೂರು ಸಲ್ಲಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಏನಾಯಿತು?",
            "ml": f"നമസ്കാരം {user_name}! ഞാൻ CivicFlow AI ആണ്. ശമ്പള പരാതി ഫയൽ ചെയ്യാൻ സഹായിക്കും. എന്ത് സംഭവിച്ചു?",
        }
        reply = greet_map.get(lang_code, (
            f"Hello {user_name}! I'm CivicFlow AI, your legal assistant. "
            "I'll help you file a Salary Non-Payment complaint with the Labour Commissioner. "
            "Tell me what happened — when did your employer stop paying your salary?"
        ))
        db.complaints.update_one(
            {"_id": cid},
            {"$set": {
                "agent_state":   "CHAT",
                "agent_history": [],          # keep empty — Sarvam requires user msg first
                "form_data":     form_data,
                "updated_at":    datetime.now(timezone.utc),
            }},
        )
        return {
            "reply":          reply,
            "action":         None,
            "action_data":    None,
            "thinking_steps": ["👋 Starting session...", f"🌐 Language: {language}"],
        }

    # ── SUBMITTED: nothing more to do ─────────────────────────────────────────
    if state == "SUBMITTED":
        return {
            "reply": "Your complaint is already filed and being tracked.",
            "action": "status_update",
            "action_data": {"status": "filed", "portal_ref_id": complaint.get("portal_ref_id", "")},
            "thinking_steps": ["✅ Complaint already filed"],
        }

    thinking_steps = ["💭 Reading your message...", f"🌐 Sarvam AI processing in {language}..."]

    # ── Call LLM ──────────────────────────────────────────────────────────────
    system = _system_prompt(state, form_data, user_name, language)
    if user_message:
        history.append({"role": "user", "content": user_message})

    # Sarvam requires: first message must be "user" (after system).
    # Strip any leading assistant messages.
    llm_history = history
    while llm_history and llm_history[0].get("role") != "user":
        llm_history = llm_history[1:]
    # If nothing left (shouldn't happen in normal flow), add a stub
    if not llm_history:
        llm_history = [{"role": "user", "content": user_message or "Hello"}]

    try:
        llm_reply = chat_completion(llm_history, system_prompt=system)
    except Exception as e:
        return _err(f"AI service unavailable: {e}")

    extracted, llm_action, reply_text = _parse_tail(llm_reply)
    history.append({"role": "assistant", "content": llm_reply})

    # Apply extracted fields
    for key, val in extracted.items():
        if key in {f[0] for f in FIELDS} and val:
            form_data[key] = str(val)
            thinking_steps.append(f"📝 Noted: {key.replace('_', ' ')} = {val}")

    # ── Execute actions ───────────────────────────────────────────────────────
    action      = None
    action_data = None
    next_state  = state

    if llm_action == "fetch_form":
        thinking_steps += ["📋 Fetching blank form from Labour Portal...", "📄 Form ready for review"]
        blank_b64 = _fetch_blank_form_b64()
        action      = "show_pdf"
        action_data = {
            "filename":   "Salary_Complaint_Form_Blank.pdf",
            "pdf_base64": blank_b64,
            "label":      "blank_form",
        }
        next_state = "SHOW_BLANK_FORM"
        if not reply_text:
            reply_text = "Here is the official Salary Non-Payment complaint form. I can fill this for you — just say 'fill it' when you're ready."

    elif llm_action == "collect_fields":
        next_state = "COLLECT_FIELDS"
        thinking_steps.append("📋 Starting field collection...")

    elif llm_action == "fill_form":
        missing = _missing(form_data)
        if missing:
            # Still missing fields — stay in COLLECT_FIELDS
            next_state = "COLLECT_FIELDS"
            field_label = missing[0][1]
            thinking_steps.append(f"⚠️ Still need: {missing[0][0]}")
        else:
            thinking_steps += ["✍️ Filling all complaint fields...", "🖨️ Generating PDF document...", "✅ PDF ready!"]
            try:
                pdf_data   = {**form_data, "declaration_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
                pdf_base64 = generate_pdf_b64("salary_non_payment", pdf_data)
                action      = "show_pdf"
                action_data = {
                    "filename":   "Your_Salary_Complaint.pdf",
                    "pdf_base64": pdf_base64,
                    "label":      "filled_form",
                }
                next_state = "PREVIEW"
                if not reply_text:
                    reply_text = "Your complaint form is ready! Please review the PDF. If everything looks correct, say 'Yes, submit it.'"
            except Exception as e:
                reply_text = f"Error generating form: {e}"

    elif llm_action == "submit":
        thinking_steps += [
            "📤 Uploading to Labour Commission Portal...",
            "⏳ Awaiting portal acknowledgement...",
            "✅ Complaint filed!",
        ]
        try:
            portal_res    = _submit_to_portal(complaint_id, user, form_data)
            portal_ref_id = portal_res.get("portal_ref_id", "")
            now           = datetime.now(timezone.utc)
            db.complaints.update_one(
                {"_id": cid},
                {
                    "$set": {
                        "status":         "filed",
                        "portal_ref_id":  portal_ref_id,
                        "agent_state":    "SUBMITTED",
                        "form_data":      form_data,
                        "agent_history":  history[-30:],
                        "updated_at":     now,
                    },
                    "$push": {
                        "timeline": {
                            "event":     "Filed with Labour Commission",
                            "timestamp": now,
                            "detail":    f"Portal ref: {portal_ref_id}",
                        }
                    },
                },
            )
            return {
                "reply": reply_text or (
                    f"Your complaint has been successfully filed! "
                    f"Reference ID: {portal_ref_id}. "
                    "You'll receive status updates as it progresses. You can track it in 'My Cases'."
                ),
                "action":      "status_update",
                "action_data": {"status": "filed", "portal_ref_id": portal_ref_id},
                "thinking_steps": thinking_steps,
            }
        except Exception as e:
            reply_text = f"Submission failed: {e}. Please try again."

    # ── Persist ───────────────────────────────────────────────────────────────
    db.complaints.update_one(
        {"_id": cid},
        {"$set": {
            "form_data":     form_data,
            "agent_state":   next_state,
            "agent_history": history[-40:],
            "updated_at":    datetime.now(timezone.utc),
        }},
    )

    return {
        "reply":          reply_text,
        "action":         action,
        "action_data":    action_data,
        "thinking_steps": thinking_steps,
    }


def _err(msg: str) -> dict:
    return {"reply": msg, "action": None, "action_data": None, "thinking_steps": []}
