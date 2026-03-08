import base64
import os

import requests

# ---------------------------------------------------------------------------
# Field definitions per subcategory (keyed by subcategory ID)
# ---------------------------------------------------------------------------

FIELD_DEFINITIONS: dict[str, list[dict]] = {
    "salary_not_paid": [
        {
            "key": "employer_name",
            "label": "Employer / Company Name",
            "question": "What is the name of your employer or company?",
        },
        {
            "key": "employer_address",
            "label": "Employer Address",
            "question": "What is the full address of the employer?",
        },
        {
            "key": "employment_start",
            "label": "Date of Joining (DD/MM/YYYY)",
            "question": "When did you start working there? (e.g. 15/03/2022)",
        },
        {
            "key": "last_salary_date",
            "label": "Last Salary Received Date",
            "question": "When was the last date you received your salary? (e.g. 31/10/2024)",
        },
        {
            "key": "months_unpaid",
            "label": "Months of Unpaid Salary",
            "question": "How many months of salary have not been paid?",
        },
        {
            "key": "amount_owed",
            "label": "Total Amount Owed (INR)",
            "question": "What is the total amount owed to you in rupees?",
        },
    ],
    "wrongful_termination": [
        {"key": "employer_name", "label": "Employer / Company Name", "question": "What is your employer's name?"},
        {"key": "termination_date", "label": "Termination Date", "question": "On what date were you terminated? (DD/MM/YYYY)"},
        {"key": "reason_given", "label": "Reason Given by Employer", "question": "What reason did the employer give for terminating you?"},
        {"key": "notice_period", "label": "Notice Period Served", "question": "Were you given any notice period? If yes, how many days?"},
    ],
    "fir_not_registered": [
        {"key": "police_station", "label": "Police Station", "question": "Which police station did you approach?"},
        {"key": "incident_date", "label": "Date of Incident", "question": "When did the incident occur? (DD/MM/YYYY)"},
        {"key": "incident_description", "label": "Description of Incident", "question": "Please describe the incident in detail."},
        {"key": "officer_name", "label": "Officer's Name (if known)", "question": "Do you know the name of the officer who refused to file the FIR?"},
    ],
}

DEFAULT_FIELDS: list[dict] = [
    {"key": "description", "label": "Description of Issue", "question": "Please describe your issue in detail."},
    {"key": "location", "label": "Location / Address", "question": "Where did this issue occur?"},
    {"key": "incident_date", "label": "Date of Incident", "question": "When did this happen? (DD/MM/YYYY)"},
]


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def get_fields(subcategory: str) -> list[dict]:
    return FIELD_DEFINITIONS.get(subcategory, DEFAULT_FIELDS)


def next_missing_field(subcategory: str, details: dict) -> dict | None:
    """Return the first field definition whose key is not yet in details, or None."""
    for field in get_fields(subcategory):
        if not details.get(field["key"]):
            return field
    return None


def build_summary(subcategory: str, details: dict) -> str:
    lines = ["Here is a summary of your complaint:\n"]
    for field in get_fields(subcategory):
        value = details.get(field["key"], "-")
        lines.append(f"  • {field['label']}: {value}")
    lines.append(
        "\nDoes everything look correct? "
        "Reply YES to submit or NO to start over."
    )
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Portal submission
# ---------------------------------------------------------------------------

def submit_to_portal(
    complaint_id: str,
    user_id: str,
    category: str,
    subcategory: str,
    form_data: dict,
    pdf_bytes: bytes,
) -> dict:
    """POST the filled form to the mock government portal."""
    portal_url = os.getenv("MOCK_PORTAL_URL", "http://localhost:5001")
    pdf_b64 = base64.b64encode(pdf_bytes).decode()
    payload = {
        "complaint_id": complaint_id,
        "user_id": user_id,
        "category": category,
        "subcategory": subcategory,
        "form_data": form_data,
        "pdf_base64": pdf_b64,
    }
    resp = requests.post(f"{portal_url}/portal/submit", json=payload, timeout=5)
    resp.raise_for_status()
    return resp.json()
