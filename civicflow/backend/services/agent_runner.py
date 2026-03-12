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

# ── Per-subcategory config ────────────────────────────────────────────────────
# Each entry: title, authority, issue_description, fields [(key, label)], form_name

SUBCATEGORY_CONFIG = {
    "salary_not_paid": {
        "title":       "Salary Non-Payment",
        "authority":   "Labour Commissioner",
        "issue":       "salary not being paid",
        "form_name":   "salary_non_payment",
        "fields": [
            ("complainant_name",      "your full name"),
            ("complainant_address",   "your current address"),
            ("complainant_phone",     "your phone number"),
            ("complainant_email",     "your email address (or type 'none' if you don't have one)"),
            ("employer_name",         "your employer / company name"),
            ("employer_address",      "your employer's full address"),
            ("nature_of_business",    "the nature of business / industry type of your employer"),
            ("employment_start_date", "date you started working"),
            ("designation",           "your job title or designation"),
            ("last_paid_date",        "last date salary was paid"),
            ("months_pending",        "number of months salary is unpaid"),
            ("amount_pending",        "total unpaid amount in rupees"),
            ("attempts_made",         "steps you already took to resolve this"),
        ],
    },
    "wrongful_termination": {
        "title":       "Wrongful Termination",
        "authority":   "Labour Commissioner",
        "issue":       "wrongful or illegal termination from job",
        "form_name":   "wrongful_termination",
        "fields": [
            ("complainant_name",   "your full name"),
            ("employer_name",      "your employer / company name"),
            ("employer_address",   "your employer's full address"),
            ("termination_date",   "date you were terminated"),
            ("reason_given",       "reason the employer gave for termination"),
            ("notice_period",      "whether you were given any notice period"),
            ("attempts_made",      "steps you already took to resolve this"),
        ],
    },
    "workplace_harassment": {
        "title":       "Workplace Harassment",
        "authority":   "Labour Commissioner / Internal Complaints Committee",
        "issue":       "workplace harassment",
        "form_name":   "workplace_harassment",
        "fields": [
            ("complainant_name",   "your full name"),
            ("employer_name",      "your employer / company name"),
            ("employer_address",   "your employer's full address"),
            ("harasser_name",      "name or designation of the person involved"),
            ("incident_date",      "date the incident occurred"),
            ("incident_details",   "description of what happened"),
            ("witnesses",          "any witnesses to the incident"),
            ("attempts_made",      "any steps taken so far to address this"),
        ],
    },
    "fir_not_registered": {
        "title":       "FIR Not Registered",
        "authority":   "Superintendent of Police",
        "issue":       "police refusing to register an FIR",
        "form_name":   "fir_not_registered",
        "fields": [
            ("complainant_name",      "your full name"),
            ("police_station",        "name of the police station you approached"),
            ("officer_name",          "name of the officer who refused (if known)"),
            ("incident_date",         "date the original incident occurred"),
            ("incident_description",  "brief description of the incident"),
            ("visit_date",            "date you went to the police station"),
            ("attempts_made",         "how many times you tried to file the FIR"),
        ],
    },
    "police_misconduct": {
        "title":       "Police Misconduct",
        "authority":   "Superintendent of Police / State Human Rights Commission",
        "issue":       "police misconduct or abuse of power",
        "form_name":   "police_misconduct",
        "fields": [
            ("complainant_name",     "your full name"),
            ("police_station",       "police station involved"),
            ("officer_name",         "name or badge number of the officer"),
            ("incident_date",        "date of the incident"),
            ("incident_description", "description of what happened"),
            ("witnesses",            "any witnesses"),
            ("attempts_made",        "any complaints already filed"),
        ],
    },
    "defective_product": {
        "title":       "Defective Product",
        "authority":   "Consumer Disputes Redressal Forum",
        "issue":       "receiving a defective or substandard product",
        "form_name":   "defective_product",
        "fields": [
            ("complainant_name",   "your full name"),
            ("seller_name",        "seller or company name"),
            ("seller_address",     "seller's address"),
            ("product_name",       "name of the product"),
            ("purchase_date",      "date of purchase"),
            ("purchase_amount",    "amount paid in rupees"),
            ("defect_description", "description of the defect"),
            ("attempts_made",      "steps taken to get a refund or replacement"),
        ],
    },
    "online_scam": {
        "title":       "Online Scam / Cyber Fraud",
        "authority":   "Cyber Crime Cell",
        "issue":       "online fraud or cyber scam",
        "form_name":   "online_scam",
        "fields": [
            ("complainant_name",   "your full name"),
            ("incident_date",      "date the scam occurred"),
            ("scam_description",   "how the scam happened"),
            ("amount_lost",        "amount of money lost in rupees"),
            ("scammer_details",    "any details about the scammer (number, account, URL)"),
            ("transaction_id",     "transaction ID or reference number if available"),
            ("attempts_made",      "steps already taken, e.g. bank complaint, police"),
        ],
    },
}

# Generic fallback for any subcategory not in config
DEFAULT_CONFIG = {
    "title":     "Complaint",
    "authority": "Relevant Authority",
    "issue":     "this issue",
    "form_name": "generic",
    "fields": [
        ("complainant_name",     "your full name"),
        ("incident_date",        "date of the incident"),
        ("incident_description", "description of the issue"),
        ("location",             "location where this occurred"),
        ("attempts_made",        "steps already taken to resolve this"),
    ],
}

def _config(subcategory: str) -> dict:
    return SUBCATEGORY_CONFIG.get(subcategory, DEFAULT_CONFIG)

# ── Agent states ──────────────────────────────────────────────────────────────
# CHAT            → understand problem, free conversation
# SHOW_BLANK_FORM → blank form shown to user
# COLLECT_FIELDS  → collecting required fields one at a time
# PREVIEW         → filled PDF shown, awaiting confirmation
# SUBMITTED       → done


def _missing(form_data: dict, fields: list) -> list:
    return [f for f in fields if not form_data.get(f[0])]


def _lang(user: dict) -> str:
    code = user.get("preferred_language", "en") or "en"
    return LANG_NAMES.get(code, "English")


def _system_prompt(state: str, form_data: dict, user_name: str, language: str, cfg: dict) -> str:
    fields        = cfg["fields"]
    missing       = _missing(form_data, fields)
    collected_str = "\n".join(f"  {k}: {v}" for k, v in form_data.items()) or "  (none yet)"
    missing_str   = ", ".join(f[0] for f in missing) if missing else "none — all collected"
    next_field    = f"Ask for: {missing[0][1]} (key: {missing[0][0]})" if missing else "All collected — ask for confirmation"

    return f"""You are CivicFlow, a compassionate AI legal assistant helping Indian citizens file government complaints.

CRITICAL: Respond ONLY in {language}. Do not use any other language.

Complaint type: {cfg["title"]}
Filing authority: {cfg["authority"]}
User's name: {user_name}
Current state: {state}
Collected info:
{collected_str}
Still needed: {missing_str}
Next task: {next_field}

## State behavior:

### CHAT — understand the user's {cfg["issue"]} through warm conversation
- When ready to file OR user says "file"/"help me file": ACTION: fetch_form

### SHOW_BLANK_FORM — blank form was shown
- When user says "fill it"/"yes"/"proceed": ACTION: collect_fields

### COLLECT_FIELDS — collect fields one by one
- Extract values from user messages via EXTRACTED
- When ALL fields done: ACTION: fill_form
- NEVER use ACTION: submit from this state — always fill_form first

### PREVIEW — filled PDF shown, awaiting confirmation
- User says yes/confirm/submit/approve: ACTION: submit
- User mentions a correction or change:
  * First extract the corrected value from their message via EXTRACTED (e.g. EXTRACTED: {{"employer_address": "123 MG Road"}})
  * Then ACTION: collect_fields
  * Acknowledge what you understood: "Got it, I'll update [field]."

## Output format (end EVERY reply with exactly these two lines — they are HIDDEN from the user):
EXTRACTED: {{"field_key": "value"}}
ACTION: none|fetch_form|collect_fields|fill_form|submit

## Rules:
- **ONE question per reply. Never ask two things at once. Period.**
- 1 warm acknowledgement + 1 question only
- NEVER include "EXTRACTED:" or "ACTION:" text in your visible reply. They are metadata only, stripped before display.
- When you learn a value, confirm it naturally in your reply (e.g. "Got it, ₹20,000 pending.")
- Do NOT list all fields you need. Ask for ONE thing, wait, then ask the next.
- When ACTION: fill_form — do NOT write a summary yourself; the system generates it automatically."""


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

    # Clean reply — strip EXTRACTED/ACTION blocks wherever they appear
    # \n? makes the leading newline optional (LLM sometimes omits it)
    clean = re.sub(r'\n?EXTRACTED:\s*\{[^}]*\}', '', text, flags=re.DOTALL)
    clean = re.sub(r'\n?ACTION:\s*\w+[^\n]*', '', clean).strip()
    return extracted, action, clean


def _build_summary(form_data: dict, cfg: dict) -> str:
    """Build a human-readable summary of all collected fields."""
    lines = ["Here is everything I have collected for your complaint:\n"]
    for key, label in cfg["fields"]:
        value = form_data.get(key)
        if value:
            # Make the label title-case and clean it up
            display_label = (
                label.replace("your ", "")
                     .replace("the ", "")
                     .strip()
                     .title()
            )
            lines.append(f"  \u2022 {display_label}: {value}")
    lines.append(
        "\nPlease review the above details carefully.\n"
        "If everything looks correct, say \u2018Yes, generate my complaint form\u2019.\n"
        "If anything is wrong, just tell me what needs to be changed."
    )
    return "\n".join(lines)


def _fetch_blank_form_b64(cfg: dict) -> str | None:
    """Fetch blank form PDF from mock portal using the subcategory's form_name.
    Falls back to salary_complaint if the specific form endpoint returns non-200."""
    try:
        form_name = cfg.get("form_name", "salary_complaint")
        resp = requests.get(f"{MOCK_PORTAL_URL}/portal/forms/{form_name}", timeout=5)
        if resp.status_code == 200:
            return base64.b64encode(resp.content).decode()
        # Fallback: portal currently only serves salary_complaint — use it for other subcategories
        if form_name != "salary_complaint":
            fallback = requests.get(f"{MOCK_PORTAL_URL}/portal/forms/salary_complaint", timeout=5)
            if fallback.status_code == 200:
                return base64.b64encode(fallback.content).decode()
    except Exception:
        pass
    return None


def _submit_to_portal(complaint_id: str, user: dict, form_data: dict, cfg: dict, category: str) -> dict:
    pdf_data   = {**form_data, "declaration_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
    pdf_base64 = generate_pdf_b64(cfg["form_name"], pdf_data)
    resp = requests.post(
        f"{MOCK_PORTAL_URL}/portal/submit",
        json={
            "complaint_id": complaint_id,
            "user_id":      str(user["_id"]),
            "category":     category,
            "form_data":    form_data,
            "pdf_base64":   pdf_base64,
        },
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


# ── State handlers ────────────────────────────────────────────────────────────

def _handle_greeting(cid, form_data: dict, cfg: dict, user: dict, language: str) -> dict:
    """CHAT + empty message → hardcoded greeting, no LLM call."""
    lang_code = user.get("preferred_language", "en") or "en"
    user_name = user.get("name", "")
    title     = cfg["title"]
    authority = cfg["authority"]

    greet_en = (
        f"Hello {user_name}! I'm CivicFlow AI, your legal assistant. "
        f"I'll help you file a {title} complaint with the {authority}. "
        f"Tell me what happened — can you describe the situation?"
    )
    greet_map = {
        "hi": f"नमस्ते {user_name}! मैं CivicFlow AI हूँ। मैं आपकी {title} शिकायत दर्ज करने में मदद करूँगा। कृपया बताएं — क्या हुआ?",
        "ta": f"வணக்கம் {user_name}! நான் CivicFlow AI. உங்கள் {title} புகாரில் உதவுவேன். என்ன நடந்தது என்று சொல்லுங்கள்.",
        "te": f"నమస్కారం {user_name}! నేను CivicFlow AI. మీ {title} సమస్యలో సహాయం చేస్తాను. ఏమి జరిగింది?",
        "kn": f"ನಮಸ್ಕಾರ {user_name}! ನಾನು CivicFlow AI. ನಿಮ್ಮ {title} ದೂರು ಸಲ್ಲಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಏನಾಯಿತು?",
        "ml": f"നമസ്കാരം {user_name}! ഞാൻ CivicFlow AI. നിങ്ങളുടെ {title} പരാതി ഫയൽ ചെയ്യാൻ സഹായിക്കും. എന്ത് സംഭവിച്ചു?",
    }
    db.complaints.update_one(
        {"_id": cid},
        {"$set": {
            "agent_state":   "CHAT",
            "agent_history": [],   # keep empty — Sarvam requires user msg first
            "form_data":     form_data,
            "updated_at":    datetime.now(timezone.utc),
        }},
    )
    return {
        "reply":          greet_map.get(lang_code, greet_en),
        "action":         None,
        "action_data":    None,
        "thinking_steps": ["👋 Starting session...", f"🌐 Language: {language}"],
    }


def _handle_rejected(cid, complaint: dict, form_data: dict, cfg: dict) -> dict:
    """REJECTED → LLM-assisted field correction, regenerate PDF, advance to PREVIEW."""
    rejection_reason = complaint.get("rejection_reason", "No reason provided.")
    thinking_steps   = ["🔄 Analysing rejection...", "✏ Preparing correction..."]

    correction_prompt = (
        f'The complaint form was rejected. Reason: "{rejection_reason}"\n\n'
        f"Current form data:\n{json.dumps(form_data, indent=2)}\n\n"
        "Based on the rejection reason, identify which field(s) need correction "
        "and provide corrected values. Respond ONLY with a JSON object like "
        '{"field_key": "corrected_value"}. If nothing specific can be identified, '
        'respond with {}.'
    )
    try:
        correction_raw = chat_completion(
            [{"role": "user", "content": correction_prompt}],
            system_prompt="You are a form correction assistant. Respond only with a JSON object.",
        )
        m = re.search(r'\{[^}]*\}', correction_raw, re.DOTALL)
        if m:
            corrections = json.loads(m.group())
            valid_keys  = {f[0] for f in cfg["fields"]}
            for k, v in corrections.items():
                if k in valid_keys and v and len(str(v)) < 500:
                    form_data[k] = str(v)
                    thinking_steps.append(f"✏ Corrected: {k.replace('_', ' ')} → {v}")
    except Exception:
        thinking_steps.append("⚠ Auto-correction skipped — regenerating with existing data...")

    try:
        pdf_data   = {**form_data, "declaration_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
        pdf_base64 = generate_pdf_b64(cfg["form_name"], pdf_data)
        thinking_steps.append("🖨️ Corrected PDF ready")
        db.complaints.update_one(
            {"_id": cid},
            {
                "$set": {
                    "form_data":   form_data,
                    "agent_state": "PREVIEW",
                    "status":      "pending",
                    "updated_at":  datetime.now(timezone.utc),
                },
                "$inc": {"resubmission_count": 1},
            },
        )
        return {
            "reply": (
                f"Your complaint was rejected. Reason: {rejection_reason}\n\n"
                "I've automatically corrected the form. Here is the corrected complaint form. "
                "Please review and approve to resubmit."
            ),
            "action": "show_pdf",
            "action_data": {
                "filename":   f"Corrected_{cfg['title'].replace(' ', '_')}_Complaint.pdf",
                "pdf_base64": pdf_base64,
                "label":      "filled_form",
            },
            "thinking_steps": thinking_steps,
        }
    except Exception as e:
        return _err(f"Could not regenerate form: {e}")


def _handle_submitted(complaint: dict) -> dict:
    """SUBMITTED → no-op, return current filed status."""
    return {
        "reply":          "Your complaint is already filed and being tracked.",
        "action":         "status_update",
        "action_data":    {"status": "filed", "portal_ref_id": complaint.get("portal_ref_id", "")},
        "thinking_steps": ["✅ Complaint already filed"],
    }


def _handle_llm_turn(
    cid, complaint_id: str, user_message: str,
    form_data: dict, state: str, history: list,
    language: str, cfg: dict, category: str, user: dict,
) -> dict:
    """
    LLM-driven turn for CHAT (with message), SHOW_BLANK_FORM, COLLECT_FIELDS, PREVIEW.
    Calls Sarvam, parses EXTRACTED / ACTION, executes the resulting action, persists.
    """
    user_name      = user.get("name", "")
    thinking_steps = ["💭 Reading your message...", f"🌐 Sarvam AI processing in {language}..."]

    # ── Call LLM ──────────────────────────────────────────────────────────────
    system = _system_prompt(state, form_data, user_name, language, cfg)
    if user_message:
        history.append({"role": "user", "content": user_message})

    # Sarvam requires first message to be "user" — strip any leading assistant turns
    llm_history = history
    while llm_history and llm_history[0].get("role") != "user":
        llm_history = llm_history[1:]
    if not llm_history:
        llm_history = [{"role": "user", "content": user_message or "Hello"}]

    try:
        llm_reply = chat_completion(llm_history, system_prompt=system)
    except Exception as e:
        return _err(f"AI service unavailable: {e}")

    extracted, llm_action, reply_text = _parse_tail(llm_reply)
    history.append({"role": "assistant", "content": llm_reply})

    # ── Apply extracted fields ─────────────────────────────────────────────
    valid_keys = {f[0] for f in cfg["fields"]}
    for key, val in extracted.items():
        # In PREVIEW state, accept any non-empty string key so user corrections
        # (e.g. "change my email") aren't silently dropped by the config allowlist.
        if val and (key in valid_keys or state == "PREVIEW") and len(str(val)) < 500:
            form_data[key] = str(val)
            thinking_steps.append(f"📝 Noted: {key.replace('_', ' ')} = {val}")

    # ── Fallback: LLM emitted only metadata, no visible reply ─────────────
    if not reply_text and llm_action in ("none", "collect_fields", ""):
        missing = _missing(form_data, cfg["fields"])
        if missing:
            noted      = [v for k, v in extracted.items() if k in valid_keys and v]
            ack        = f"Got it{', ' + noted[0] if noted else ''}! " if extracted else ""
            reply_text = f"{ack}Could you please tell me {missing[0][1]}?"
        else:
            reply_text = "Got it! Let me now prepare your complaint form."
            llm_action = "fill_form"

    # ── Override: all fields collected → skip to fill_form ────────────────
    if llm_action == "collect_fields" and not _missing(form_data, cfg["fields"]):
        llm_action = "fill_form"

    # ── Guard: LLM said "submit" outside PREVIEW → force fill_form first ──
    # Prevents the model from bypassing COLLECT_DOCS + PREVIEW states.
    if llm_action == "submit" and state != "PREVIEW":
        llm_action = "fill_form"

    # ── Guard: LLM said "fill_form" from PREVIEW → treat as submit ────────
    # Prevents double-PDF-generation when user confirms from PREVIEW.
    if llm_action == "fill_form" and state == "PREVIEW":
        llm_action = "submit"

    # ── Execute action ─────────────────────────────────────────────────────
    action      = None
    action_data = None
    next_state  = state

    if llm_action == "fetch_form":
        thinking_steps += [f"📋 Fetching blank {cfg['title']} form...", "📄 Form ready for review"]
        action      = "show_pdf"
        action_data = {
            "filename":   f"{cfg['title'].replace(' ', '_')}_Form_Blank.pdf",
            "pdf_base64": _fetch_blank_form_b64(cfg),
            "label":      "blank_form",
        }
        next_state = "SHOW_BLANK_FORM"
        if not reply_text:
            reply_text = (
                f"Here is the official {cfg['title']} complaint form. "
                "I can fill this for you — just say 'fill it' when you're ready."
            )

    elif llm_action == "collect_fields":
        next_state = "COLLECT_FIELDS"
        thinking_steps.append("📋 Starting field collection...")

    elif llm_action == "fill_form":
        missing = _missing(form_data, cfg["fields"])
        if missing:
            next_state = "COLLECT_FIELDS"
            thinking_steps.append(f"⚠️ Still need: {missing[0][0]}")
        else:
            thinking_steps += ["✍️ All fields collected", "📋 Preparing document collection..."]
            # Persist fields and transition to COLLECT_DOCS (signature + documents)
            db.complaints.update_one(
                {"_id": cid},
                {"$set": {
                    "form_data":     form_data,
                    "agent_state":   "COLLECT_DOCS",
                    "docs_stage":    "signature",
                    "agent_history": history[-40:],
                    "updated_at":    datetime.now(timezone.utc),
                }},
            )
            return {
                "reply": reply_text or (
                    "Great! I\'ve collected all the information. "
                    "Before generating your complaint form, I need your signature. "
                    "Please upload a photo of your signature, or tap \'Skip\' to continue without one."
                ),
                "action": "request_signature",
                "action_data": {},
                "thinking_steps": thinking_steps,
            }

    elif llm_action == "submit":
        thinking_steps += [
            f"📤 Uploading to {cfg['authority']}...",
            "⏳ Awaiting portal acknowledgement...",
            "✅ Complaint filed!",
        ]
        try:
            portal_res    = _submit_to_portal(complaint_id, user, form_data, cfg, category)
            portal_ref_id = portal_res.get("portal_ref_id", "")
            now           = datetime.now(timezone.utc)
            db.complaints.update_one(
                {"_id": cid},
                {
                    "$set": {
                        "status":        "filed",
                        "portal_ref_id": portal_ref_id,
                        "agent_state":   "SUBMITTED",
                        "form_data":     form_data,
                        "agent_history": history[-30:],
                        "updated_at":    now,
                    },
                    "$push": {
                        "timeline": {
                            "event":     f"Filed with {cfg['authority']}",
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
                "action":         "status_update",
                "action_data":    {"status": "filed", "portal_ref_id": portal_ref_id},
                "thinking_steps": thinking_steps,
            }
        except Exception as e:
            reply_text = f"Submission failed: {e}. Please try again."

    # ── Persist ───────────────────────────────────────────────────────────
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


# ── COLLECT_DOCS state handler ───────────────────────────────────────────────

def _handle_collect_docs(cid, complaint: dict, form_data: dict, cfg: dict, user_message: str = "") -> dict:
    """
    COLLECT_DOCS state: two sub-stages driven by complaint.docs_stage.
      signature  → wait for signature upload or explicit skip, then advance
      documents  → wait for explicit "done"/"skip", then generate PDF → PREVIEW

    HIGH-4 fix: transitions are gated on confirmed uploads or explicit user intent,
    not on any arbitrary message — prevents race-condition bypass via a second API call.
    """
    docs_stage = complaint.get("docs_stage", "signature")
    msg_lower  = user_message.lower()

    if docs_stage == "signature":
        # Advance only if the upload API already stored the signature, or user skipped
        sig_uploaded = bool(complaint.get("signature_b64"))
        user_skipped = any(k in msg_lower for k in ("skip", "no signature", "without signature"))
        if not sig_uploaded and not user_skipped:
            # Re-show the request — don't advance on random messages
            return {
                "reply": None,
                "action": "request_signature",
                "action_data": {},
                "thinking_steps": [],
            }
        # Advance to documents sub-stage
        db.complaints.update_one(
            {"_id": cid},
            {"$set": {"docs_stage": "documents", "updated_at": datetime.now(timezone.utc)}},
        )
        return {
            "reply": (
                "Got it! Now please upload any supporting documents relevant to your case — "
                "such as pay slips, bank statements, employment letter, or written notices. "
                "You can add multiple. Tap 'Done' when finished, or 'Skip' to proceed without documents."
            ),
            "action": "request_documents",
            "action_data": {},
            "thinking_steps": ["✅ Signature step complete", "📎 Ready for supporting documents..."],
        }

    # docs_stage == "documents" — only generate when user explicitly signals done/skip
    user_is_done = any(k in msg_lower for k in ("done", "skip", "generate", "finish", "proceed", "no document"))
    if not user_is_done:
        return {
            "reply": None,
            "action": "request_documents",
            "action_data": {},
            "thinking_steps": [],
        }

    signature_b64   = complaint.get("signature_b64")
    supporting_docs = list(complaint.get("supporting_docs") or [])

    try:
        pdf_data   = {**form_data, "declaration_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
        pdf_base64 = generate_pdf_b64(
            cfg["form_name"], pdf_data,
            signature_b64=signature_b64,
            supporting_docs=supporting_docs,
        )
        doc_count = len(supporting_docs)
        has_sig   = bool(signature_b64)
        extras    = []
        if has_sig:    extras.append("your signature")
        if doc_count:  extras.append(f"{doc_count} supporting document{'s' if doc_count != 1 else ''}")
        extra_text = (" with " + " and ".join(extras)) if extras else ""

        db.complaints.update_one(
            {"_id": cid},
            {"$set": {
                "agent_state": "PREVIEW",
                "form_data":   form_data,
                "updated_at":  datetime.now(timezone.utc),
            }},
        )
        return {
            "reply": f"Your complaint form is ready{extra_text}! Please review it carefully before submitting.",
            "action": "show_pdf",
            "action_data": {
                "filename":   f"Your_{cfg['title'].replace(' ', '_')}_Complaint.pdf",
                "pdf_base64": pdf_base64,
                "label":      "filled_form",
            },
            "thinking_steps": [
                "✍️ Embedding signature..." if has_sig else "ℹ️ No signature provided",
                f"📎 Attaching {doc_count} document(s)..." if doc_count else "ℹ️ No attachments",
                "✅ Final PDF ready!",
            ],
        }
    except Exception as e:
        return _err(f"Could not generate final form: {e}")


# ── Main entry (dispatcher) ───────────────────────────────────────────────────

def run_agent(complaint_id: str, user_message: str, user: dict) -> dict:
    """
    One agent turn. Loads complaint from DB, dispatches to the correct state handler.
    Returns: { reply, action, action_data, thinking_steps }
    """
    cid       = ObjectId(complaint_id)
    complaint = db.complaints.find_one({"_id": cid, "user_id": user["_id"]})
    if not complaint:
        return _err("Complaint not found.")

    form_data   = dict(complaint.get("form_data") or {})
    state       = complaint.get("agent_state", "CHAT")
    history     = list(complaint.get("agent_history") or [])
    language    = _lang(user)
    subcategory = complaint.get("subcategory", "")
    category    = complaint.get("category", "")
    cfg         = _config(subcategory)

    # Auto-prefill user's own name
    if user.get("name") and not form_data.get("complainant_name"):
        form_data["complainant_name"] = user["name"]

    if state == "CHAT" and not user_message:
        return _handle_greeting(cid, form_data, cfg, user, language)
    if state == "REJECTED":
        return _handle_rejected(cid, complaint, form_data, cfg)
    if state == "SUBMITTED":
        return _handle_submitted(complaint)
    if state == "COLLECT_DOCS":
        return _handle_collect_docs(cid, complaint, form_data, cfg, user_message)

    return _handle_llm_turn(
        cid, complaint_id, user_message,
        form_data, state, history,
        language, cfg, category, user,
    )


def _err(msg: str) -> dict:
    return {"reply": msg, "action": None, "action_data": None, "thinking_steps": []}
