"""
Nivedan AI Agent — Phase 6
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

# ── Fixed translated messages (for non-LLM-driven turns) ─────────────────────

_FIXED_MSGS: dict[str, dict[str, str]] = {
    "sig_request": {
        "en": "Great! I've collected all the information. Before generating your complaint form, I need your signature. Please upload a photo of your signature, or tap 'Skip' to continue without one.",
        "hi": "बढ़िया! सारी जानकारी मिल गई। फ़ॉर्म बनाने से पहले आपके हस्ताक्षर चाहिए। कृपया हस्ताक्षर की फ़ोटो अपलोड करें, या बिना हस्ताक्षर के जारी रखने के लिए 'Skip' दबाएं।",
        "te": "చాలా బాగుంది! అన్ని వివరాలు సేకరించాను. ఫారం తయారు చేయడానికి ముందు మీ సంతకం కావాలి. దయచేసి సంతకం ఫోటో అప్‌లోడ్ చేయండి, లేదా సంతకం లేకుండా కొనసాగించడానికి 'Skip' నొక్కండి.",
        "ta": "நன்றாக! எல்லா தகவல்களும் சேகரிக்கப்பட்டன. படிவம் தயாரிக்க உங்கள் கையொப்பம் தேவை. கையொப்பத்தின் புகைப்படத்தை பதிவேற்றவும், அல்லது 'Skip' அழுத்தவும்.",
        "kn": "ಅದ್ಭುತ! ಎಲ್ಲಾ ಮಾಹಿತಿ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ. ಫಾರ್ಮ್ ತಯಾರಿಸುವ ಮೊದಲು ನಿಮ್ಮ ಸಹಿ ಬೇಕು. ಸಹಿಯ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ಅಥವಾ 'Skip' ಒತ್ತಿ.",
        "ml": "മികച്ചത്! എല്ലാ വിവരങ്ങളും ശേഖരിച്ചു. ഫോം തയ്യാറാക്കുന്നതിന് മുമ്പ് നിങ്ങളുടെ ഒപ്പ് ആവശ്യമാണ്. ഒപ്പിന്റെ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക, അല്ലെങ്കിൽ 'Skip' അമർത്തുക.",
    },
    "doc_request": {
        "en": "Got it! Now please upload any supporting documents relevant to your case — such as pay slips, bank statements, employment letter, or written notices. You can add multiple. Tap 'Done' when finished, or 'Skip' to proceed without documents.",
        "hi": "ठीक है! अब अपने मामले से संबंधित दस्तावेज़ अपलोड करें — जैसे वेतन पर्ची, बैंक स्टेटमेंट, नियोजन पत्र, या नोटिस। कई दस्तावेज़ जोड़ सकते हैं। पूरा होने पर 'Done' दबाएं, या दस्तावेज़ के बिना आगे बढ़ने के लिए 'Skip' दबाएं।",
        "te": "అర్థమైంది! ఇప్పుడు మీ కేసుకు సంబంధించిన మద్దతు పత్రాలు అప్‌లోడ్ చేయండి — జీతపు స్లిప్‌లు, బ్యాంక్ స్టేట్‌మెంట్లు, ఉద్యోగ లేఖ లేదా నోటీసులు. బహుళ పత్రాలు జోడించవచ్చు. పూర్తయినప్పుడు 'Done' నొక్కండి, లేదా పత్రాలు లేకుండా కొనసాగించడానికి 'Skip' నొక్కండి.",
        "ta": "சரி! இப்போது உங்கள் வழக்கிற்கு தொடர்புடைய ஆவணங்களை பதிவேற்றவும் — சம்பள சீட்டுகள், வங்கி அறிக்கைகள், வேலை கடிதம் அல்லது நோட்டீஸ்கள். பல ஆவணங்கள் சேர்க்கலாம். முடிந்ததும் 'Done' அழுத்தவும், அல்லது 'Skip' அழுத்தவும்.",
        "kn": "ಅರ್ಥವಾಯಿತು! ಈಗ ನಿಮ್ಮ ಪ್ರಕರಣಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ — ವೇತನ ಚೀಟಿ, ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್‌ಮೆಂಟ್, ನೌಕರಿ ಪತ್ರ ಅಥವಾ ನೋಟಿಸ್‌ಗಳು. ಅನೇಕ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸಬಹುದು. ಮುಗಿದಾಗ 'Done' ಒತ್ತಿ, ಅಥವಾ 'Skip' ಒತ್ತಿ.",
        "ml": "ശരി! ഇപ്പോൾ നിങ്ങളുടെ കേസുമായി ബന്ധപ്പെട്ട ആധാരങ്ങൾ അപ്‌ലോഡ് ചെയ്യുക — ശമ്പള സ്ലിപ്പുകൾ, ബാങ്ക് സ്റ്റേറ്റ്‌മെന്റുകൾ, ജോലി കത്ത് അല്ലെങ്കിൽ നോട്ടീസുകൾ. ഒന്നിലധികം ചേർക്കാം. കഴിഞ്ഞാൽ 'Done' അമർത്തുക, അല്ലെങ്കിൽ 'Skip' അമർത്തുക.",
    },
    "already_filed": {
        "en": "Your complaint is already filed and being tracked.",
        "hi": "आपकी शिकायत पहले ही दर्ज हो चुकी है और ट्रैक की जा रही है।",
        "te": "మీ ఫిర్యాదు ఇప్పటికే దాఖలు చేయబడింది మరియు ట్రాక్ చేయబడుతోంది.",
        "ta": "உங்கள் புகார் ஏற்கனவே தாக்கல் செய்யப்பட்டு கண்காணிக்கப்படுகிறது.",
        "kn": "ನಿಮ್ಮ ದೂರನ್ನು ಈಗಾಗಲೇ ದಾಖಲಿಸಲಾಗಿದೆ ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡಲಾಗುತ್ತಿದೆ.",
        "ml": "നിങ്ങളുടെ പരാതി ഇതിനോടകം ഫയൽ ചെയ്യപ്പെട്ടു, ട്രാക്ക് ചെയ്യപ്പെടുന്നു.",
    },
    "pdf_ready": {
        "en": "Your complaint form is ready{extra}! Please review it carefully before submitting.",
        "hi": "आपका शिकायत फ़ॉर्म तैयार है{extra}! कृपया सबमिट करने से पहले ध्यान से जांचें।",
        "te": "మీ ఫిర్యాదు ఫారం సిద్ధంగా ఉంది{extra}! సమర్పించే ముందు జాగ్రత్తగా సమీక్షించండి.",
        "ta": "உங்கள் புகார் படிவம் தயார்{extra}! சமர்ப்பிக்கும் முன் கவனமாக சரிபார்க்கவும்.",
        "kn": "ನಿಮ್ಮ ದೂರು ಫಾರ್ಮ್ ಸಿದ್ಧವಾಗಿದೆ{extra}! ಸಲ್ಲಿಸುವ ಮೊದಲು ಎಚ್ಚರಿಕೆಯಿಂದ ಪರಿಶೀಲಿಸಿ.",
        "ml": "നിങ്ങളുടെ പരാതി ഫോം തയ്യാറാണ്{extra}! സമർപ്പിക്കുന്നതിന് മുമ്പ് ശ്രദ്ധാപൂർവ്വം അവലോകനം ചെയ്യുക.",
    },
    "resume_sig": {
        "en": "Welcome back! Please upload your signature to continue.",
        "hi": "वापस स्वागत है! जारी रखने के लिए अपने हस्ताक्षर अपलोड करें।",
        "te": "తిరిగి స్వాగతం! కొనసాగించడానికి మీ సంతకం అప్‌లోడ్ చేయండి.",
        "ta": "மீண்டும் வரவேற்கிறோம்! தொடர உங்கள் கையொப்பத்தை பதிவேற்றவும்.",
        "kn": "ಮತ್ತೆ ಸ್ವಾಗತ! ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಸಹಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
        "ml": "തിരിച്ചു സ്വാഗതം! തുടരാൻ നിങ്ങളുടെ ഒപ്പ് അപ്‌ലോഡ് ചെയ്യുക.",
    },
    "resume_docs": {
        "en": "Welcome back! Please upload your supporting documents, then tap Done.",
        "hi": "वापस स्वागत है! कृपया अपने दस्तावेज़ अपलोड करें, फिर Done दबाएं।",
        "te": "తిరిగి స్వాగతం! దయచేసి మీ మద్దతు పత్రాలు అప్‌లోడ్ చేయండి, తర్వాత Done నొక్కండి.",
        "ta": "மீண்டும் வரவேற்கிறோம்! உங்கள் ஆதரவு ஆவணங்களை பதிவேற்றி Done அழுத்தவும்.",
        "kn": "ಮತ್ತೆ ಸ್ವಾಗತ! ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ನಂತರ Done ಒತ್ತಿ.",
        "ml": "തിരിച്ചു സ്വാഗതം! മദ്ദതു രേഖകൾ അപ്‌ലോഡ് ചെയ്ത് Done അമർത്തുക.",
    },
    "resume_preview": {
        "en": "Welcome back! Here is your complaint form. Please review and confirm to submit.",
        "hi": "वापस स्वागत है! यह आपका शिकायत फ़ॉर्म है। कृपया समीक्षा करें और सबमिट करने के लिए पुष्टि करें।",
        "te": "తిరిగి స్వాగతం! ఇది మీ ఫిర్యాదు ఫారం. దయచేసి సమీక్షించి సమర్పించడానికి నిర్ధారించండి.",
        "ta": "மீண்டும் வரவேற்கிறோம்! இது உங்கள் புகார் படிவம். சமர்ப்பிக்க சரிபார்த்து உறுதிப்படுத்தவும்.",
        "kn": "ಮತ್ತೆ ಸ್ವಾಗತ! ಇದು ನಿಮ್ಮ ದೂರು ಫಾರ್ಮ್. ಸಲ್ಲಿಸಲು ಪರಿಶೀಲಿಸಿ ದೃಢೀಕರಿಸಿ.",
        "ml": "തിരിച്ചു സ്വാഗതം! ഇതാണ് നിങ്ങളുടെ പരാതി ഫോം. സമർപ്പിക്കാൻ അവലോകനം ചെയ്ത് സ്ഥിരീകരിക്കുക.",
    },
}


def _t(key: str, lang_code: str, **fmt) -> str:
    """Look up a fixed translated message. Falls back to English."""
    msgs = _FIXED_MSGS.get(key, {})
    text = msgs.get(lang_code) or msgs.get("en", "")
    return text.format(**fmt) if fmt else text

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

    return f"""You are Nivedan, a compassionate AI legal assistant helping Indian citizens file government complaints.

LANGUAGE RULES (follow strictly):
1. Respond ONLY in {language}. Do not switch to any other language.
2. The user may type in transliterated/romanised form — e.g. "naku salary ichhadam ledu" (Telugu in English letters) or "mujhe salary nahi mili" (Hindi in English letters). Understand such input as {language} and respond in {language} script.
3. EXTRACTED: and ACTION: lines must ALWAYS be written in plain English/ASCII — never translate these tags or their keys.
4. Values inside EXTRACTED must be in English or standard numerals (transliterate native-script answers to English before placing them in EXTRACTED). For example if the user gives their name in Telugu script, write the English equivalent in EXTRACTED.

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
    complaint       = db.complaints.find_one({"_id": ObjectId(complaint_id)})
    signature_b64   = (complaint or {}).get("signature_b64")
    supporting_docs = list((complaint or {}).get("supporting_docs") or [])

    pdf_data   = {**form_data, "declaration_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
    pdf_base64 = generate_pdf_b64(
        cfg["form_name"], pdf_data,
        signature_b64=signature_b64,
        supporting_docs=supporting_docs,
    )
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
        f"Hello {user_name}! I'm Nivedan AI, your legal assistant. "
        f"I'll help you file a {title} complaint with the {authority}. "
        f"Tell me what happened — can you describe the situation?"
    )
    greet_map = {
        "hi": f"नमस्ते {user_name}! मैं Nivedan AI हूँ। मैं आपकी {title} शिकायत दर्ज करने में मदद करूँगा। कृपया बताएं — क्या हुआ?",
        "ta": f"வணக்கம் {user_name}! நான் Nivedan AI. உங்கள் {title} புகாரில் உதவுவேன். என்ன நடந்தது என்று சொல்லுங்கள்.",
        "te": f"నమస్కారం {user_name}! నేను Nivedan AI. మీ {title} సమస్యలో సహాయం చేస్తాను. ఏమి జరిగింది?",
        "kn": f"ನಮಸ್ಕಾರ {user_name}! ನಾನು Nivedan AI. ನಿಮ್ಮ {title} ದೂರು ಸಲ್ಲಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಏನಾಯಿತು?",
        "ml": f"നമസ്കാരം {user_name}! ഞാൻ Nivedan AI. നിങ്ങളുടെ {title} പരാതി ഫയൽ ചെയ്യാൻ സഹായിക്കും. എന്ത് സംഭവിച്ചു?",
    }
    greeting_text = greet_map.get(lang_code, greet_en)
    # Save greeting as first assistant entry so resume can display it.
    # _handle_llm_turn strips leading assistant turns before calling Sarvam,
    # so this does NOT break the "user msg first" requirement.
    db.complaints.update_one(
        {"_id": cid},
        {"$set": {
            "agent_state":   "CHAT",
            "agent_history": [{"role": "assistant", "content": greeting_text}],
            "form_data":     form_data,
            "updated_at":    datetime.now(timezone.utc),
        }},
    )
    return {
        "reply":          greeting_text,
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
        signature_b64   = complaint.get("signature_b64")
        supporting_docs = list(complaint.get("supporting_docs") or [])
        pdf_data   = {**form_data, "declaration_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
        pdf_base64 = generate_pdf_b64(
            cfg["form_name"], pdf_data,
            signature_b64=signature_b64,
            supporting_docs=supporting_docs,
        )
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
    except Exception:
        import logging
        logging.getLogger(__name__).exception("Could not regenerate form after rejection")
        return _err("Could not regenerate the form. Please try again.")


def _handle_submitted(complaint: dict, lang_code: str = "en") -> dict:
    """SUBMITTED → no-op, return current filed status."""
    return {
        "reply":          _t("already_filed", lang_code),
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
        llm_reply = chat_completion(llm_history[-40:], system_prompt=system)
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("Sarvam call failed")
        return _err("AI service is temporarily unavailable. Please try again.")

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
            lang_code = user.get("preferred_language", "en") or "en"
            return {
                "reply": reply_text or _t("sig_request", lang_code),
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
        except Exception:
            import logging
            logging.getLogger(__name__).exception("Portal submission failed for %s", complaint_id)
            reply_text = "Submission failed. Please try again in a moment."

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

def _handle_collect_docs(cid, complaint: dict, form_data: dict, cfg: dict, user_message: str = "", lang_code: str = "en") -> dict:
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
            "reply": _t("doc_request", lang_code),
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
            "reply": _t("pdf_ready", lang_code, extra=extra_text),
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
    lang_code   = user.get("preferred_language", "en") or "en"
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
        return _handle_submitted(complaint, lang_code)
    if state == "COLLECT_DOCS":
        return _handle_collect_docs(cid, complaint, form_data, cfg, user_message, lang_code)

    return _handle_llm_turn(
        cid, complaint_id, user_message,
        form_data, state, history,
        language, cfg, category, user,
    )


def resume_agent(complaint_id: str, user: dict) -> dict:
    """
    Resume an existing conversation.
    Returns the appropriate UI state (last reply + action) without triggering an LLM call
    or resetting agent_history.
    """
    import logging as _logging
    _log = _logging.getLogger(__name__)

    cid       = ObjectId(complaint_id)
    # Use $or to match both ObjectId and legacy string user_id formats
    user_oid  = user["_id"]
    complaint = db.complaints.find_one({
        "_id": cid,
        "$or": [{"user_id": user_oid}, {"user_id": str(user_oid)}],
    })
    if not complaint:
        _log.warning("resume_agent: complaint %s not found for user %s", complaint_id, user_oid)
        return _err("Complaint not found.")

    state       = complaint.get("agent_state", "CHAT")
    history     = list(complaint.get("agent_history") or [])
    _log.info("resume_agent: complaint=%s state=%s history_len=%d", complaint_id, state, len(history))
    form_data   = dict(complaint.get("form_data") or {})
    subcategory = complaint.get("subcategory", "")
    cfg         = _config(subcategory)
    lang_code   = (user.get("preferred_language") or "en")

    # Extract the last clean assistant reply from persisted history
    last_reply = None
    for msg in reversed(history):
        if msg.get("role") == "assistant":
            _, _, clean = _parse_tail(msg.get("content", ""))
            if clean:
                last_reply = clean
                break

    # Build cleaned display history (strip EXTRACTED/ACTION metadata from assistant msgs)
    display_history = []
    for msg in history:
        role    = msg.get("role")
        content = msg.get("content", "")
        if role == "user" and content:
            display_history.append({"role": "user", "text": content})
        elif role == "assistant":
            _, _, clean = _parse_tail(content)
            if clean:
                display_history.append({"role": "assistant", "text": clean})

    def _with_history(result: dict) -> dict:
        result["history"] = display_history
        return result

    if state == "SUBMITTED":
        return _with_history(_handle_submitted(complaint, lang_code))

    if state == "COLLECT_DOCS":
        docs_stage = complaint.get("docs_stage", "signature")
        if docs_stage == "signature":
            return _with_history({
                "reply":          last_reply or _t("resume_sig", lang_code),
                "action":         "request_signature",
                "action_data":    {},
                "thinking_steps": [],
            })
        return _with_history({
            "reply":          last_reply or _t("resume_docs", lang_code),
            "action":         "request_documents",
            "action_data":    {},
            "thinking_steps": [],
        })

    if state == "PREVIEW":
        try:
            signature_b64   = complaint.get("signature_b64")
            supporting_docs = list(complaint.get("supporting_docs") or [])
            pdf_data        = {**form_data, "declaration_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
            pdf_base64      = generate_pdf_b64(
                cfg["form_name"], pdf_data,
                signature_b64=signature_b64,
                supporting_docs=supporting_docs,
            )
            return _with_history({
                "reply":       last_reply or _t("resume_preview", lang_code),
                "action":      "show_pdf",
                "action_data": {
                    "filename":   f"Your_{cfg['title'].replace(' ', '_')}_Complaint.pdf",
                    "pdf_base64": pdf_base64,
                    "label":      "filled_form",
                },
                "thinking_steps": [],
            })
        except Exception:
            pass  # Fall through to plain reply

    # CHAT / SHOW_BLANK_FORM / COLLECT_FIELDS — just return the last reply
    if not last_reply:
        lang_code = user.get("preferred_language", "en") or "en"
        user_name = user.get("name", "")
        greet_map = {
            "hi": f"वापस स्वागत है {user_name}! चलिए जारी रखते हैं।",
            "ta": f"மீண்டும் வரவேற்கிறோம் {user_name}! தொடர்வோம்.",
            "te": f"తిరిగి స్వాగతం {user_name}! కొనసాగిద్దాం.",
            "kn": f"ಮರಳಿ ಸ್ವಾಗತ {user_name}! ಮುಂದುವರಿಸೋಣ.",
            "ml": f"തിരിച്ചു സ്വാഗതം {user_name}! തുടരാം.",
        }
        last_reply = greet_map.get(lang_code, f"Welcome back {user_name}! Let's continue where we left off.")

    return _with_history({
        "reply":          last_reply,
        "action":         None,
        "action_data":    None,
        "thinking_steps": [],
    })


def _err(msg: str) -> dict:
    return {"reply": msg, "action": None, "action_data": None, "thinking_steps": []}
