from dotenv import load_dotenv
load_dotenv()

import base64
import io
import os
import uuid
from datetime import datetime, timezone

import requests
from bson import ObjectId
from flask import Flask, jsonify, redirect, render_template, request, send_file
from flask_cors import CORS
from fpdf import FPDF
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

_client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/Nivedan_portal"))
db = _client.get_default_database()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")

# ---------------------------------------------------------------------------
# Predefined workflow steps per category.
# The portal advances submissions through these steps in order.
# ---------------------------------------------------------------------------
WORKFLOW_STEPS = {
    "Labor Issues": [
        "Application received at District Labour Office",
        "Application sent to Labour Officer",
        "Notice sent to employer",
        "Application signed by Authority",
        "Reviewed by Senior Officials",
        "Resolved — Employer directed to pay",
    ],
    "Police & Criminal": [
        "Complaint received at police station",
        "FIR registered",
        "Investigation assigned to officer",
        "Inquiry completed",
        "Report submitted to magistrate",
        "Case resolved",
    ],
    "Consumer Complaint": [
        "Complaint received at consumer forum",
        "Notice issued to opposite party",
        "Evidence and documents reviewed",
        "Hearing scheduled",
        "Order passed by forum",
        "Case resolved",
    ],
    "Cyber Fraud": [
        "Complaint received at cyber cell",
        "Case registered and assigned",
        "Technical investigation started",
        "Evidence collected",
        "Report sent to nodal officer",
        "Case resolved",
    ],
    "default": [
        "Application received",
        "Under review",
        "Processed by authority",
        "Final review",
        "Resolved",
    ],
}


def _get_steps(category: str) -> list[str]:
    for key in WORKFLOW_STEPS:
        if key != "default" and key.lower() in category.lower():
            return WORKFLOW_STEPS[key]
    return WORKFLOW_STEPS["default"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now() -> datetime:
    return datetime.now(timezone.utc)


WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")


def _fire_webhook(payload: dict) -> None:
    """POST status update to main backend. Never raises."""
    try:
        headers = {}
        if WEBHOOK_SECRET:
            headers["X-Webhook-Secret"] = WEBHOOK_SECRET
        requests.post(f"{BACKEND_URL}/webhooks/portal", json=payload, headers=headers, timeout=3)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Admin dashboard
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return redirect("/portal/dashboard")


@app.route("/portal/dashboard")
def dashboard():
    submissions = list(db.portal_submissions.find().sort("received_at", -1))
    for s in submissions:
        s["_id"] = str(s["_id"])
        s["has_pdf"] = bool(s.get("pdf_base64"))
        steps = _get_steps(s.get("category", ""))
        s["workflow_steps"] = steps
        s["current_step_index"] = s.get("current_step_index", 0)
        s["next_step_label"] = (
            steps[s["current_step_index"] + 1]
            if s["current_step_index"] + 1 < len(steps)
            else None
        )

    counts = {
        "total": len(submissions),
        "received": sum(1 for s in submissions if s["status"] == "received"),
        "in_progress": sum(1 for s in submissions if s["status"] in ("under_review", "next_step")),
        "failed": sum(1 for s in submissions if s["status"] == "failed"),
        "resolved": sum(1 for s in submissions if s["status"] == "resolved"),
    }
    return render_template("dashboard.html", submissions=submissions, counts=counts)


# ---------------------------------------------------------------------------
# POST /portal/submit
# ---------------------------------------------------------------------------

@app.route("/portal/submit", methods=["POST"])
def receive_submission():
    data = request.get_json(silent=True) or {}

    portal_ref_id = uuid.uuid4().hex[:8].upper()
    now = _now()
    category = data.get("category", "Unknown")
    steps = _get_steps(category)
    first_step = steps[0] if steps else "Application received"

    doc = {
        "portal_ref_id": portal_ref_id,
        "complaint_id": data.get("complaint_id"),
        "user_id": data.get("user_id"),
        "category": category,
        "form_data": data.get("form_data", {}),
        "pdf_base64": data.get("pdf_base64"),
        "status": "received",
        "current_step_index": 0,
        "timeline": [
            {"event": first_step, "timestamp": now.isoformat()}
        ],
        "received_at": now,
        "updated_at": now,
    }

    db.portal_submissions.insert_one(doc)
    return jsonify({"portal_ref_id": portal_ref_id, "status": "received"}), 201


# ---------------------------------------------------------------------------
# GET /portal/submissions
# ---------------------------------------------------------------------------

@app.route("/portal/submissions", methods=["GET"])
def list_submissions():
    submissions = list(db.portal_submissions.find().sort("received_at", -1))
    for s in submissions:
        s["_id"] = str(s["_id"])
        s.pop("pdf_base64", None)
        s["received_at"] = s.get("received_at", _now()).isoformat()
        s["updated_at"] = s.get("updated_at", _now()).isoformat()
    return jsonify(submissions), 200


# ---------------------------------------------------------------------------
# POST /portal/action
# ---------------------------------------------------------------------------

@app.route("/portal/action", methods=["POST"])
def take_action():
    data = request.get_json(silent=True) or {}

    portal_ref_id = data.get("portal_ref_id", "").strip().upper()
    action = data.get("action")                   # "next_step" | "abort"
    reason = (data.get("reason") or "").strip()

    if action not in ("next_step", "abort"):
        return jsonify({"error": "action must be 'next_step' or 'abort'"}), 400

    sub = db.portal_submissions.find_one({"portal_ref_id": portal_ref_id})
    if not sub:
        return jsonify({"error": "Submission not found"}), 404

    steps = _get_steps(sub.get("category", ""))
    current_index = sub.get("current_step_index", 0)
    now = _now()

    if action == "next_step":
        next_index = current_index + 1
        if next_index >= len(steps):
            new_status = "resolved"
            event_label = "Case resolved"
        else:
            new_status = "next_step"
            event_label = steps[next_index]

        db.portal_submissions.update_one(
            {"portal_ref_id": portal_ref_id},
            {
                "$set": {
                    "status": new_status,
                    "current_step_index": next_index,
                    "updated_at": now,
                },
                "$push": {"timeline": {"event": event_label, "timestamp": now.isoformat()}},
            },
        )

        _fire_webhook({
            "complaint_id": sub.get("complaint_id"),
            "portal_ref_id": portal_ref_id,
            "status": new_status,
            "reason": "",
            "next_step_label": event_label,
        })

        return jsonify({
            "portal_ref_id": portal_ref_id,
            "status": new_status,
            "step": event_label,
        }), 200

    else:  # abort
        abort_reason = reason or "Application aborted by authority"
        db.portal_submissions.update_one(
            {"portal_ref_id": portal_ref_id},
            {
                "$set": {"status": "failed", "updated_at": now},
                "$push": {
                    "timeline": {"event": abort_reason, "timestamp": now.isoformat()}
                },
            },
        )

        _fire_webhook({
            "complaint_id": sub.get("complaint_id"),
            "portal_ref_id": portal_ref_id,
            "status": "failed",
            "reason": abort_reason,
            "next_step_label": "",
        })

        return jsonify({"portal_ref_id": portal_ref_id, "status": "failed"}), 200


# ---------------------------------------------------------------------------
# GET /portal/pdf/<portal_ref_id>
# ---------------------------------------------------------------------------

@app.route("/portal/pdf/<portal_ref_id>")
def view_pdf(portal_ref_id: str):
    sub = db.portal_submissions.find_one(
        {"portal_ref_id": portal_ref_id.upper()}, {"pdf_base64": 1}
    )
    if not sub or not sub.get("pdf_base64"):
        return "PDF not found for this submission.", 404

    pdf_bytes = base64.b64decode(sub["pdf_base64"])
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        download_name=f"complaint_{portal_ref_id}.pdf",
    )


# ---------------------------------------------------------------------------
# GET /portal/forms/salary_complaint  — blank salary form (fpdf2)
# ---------------------------------------------------------------------------

@app.route("/portal/forms/salary_complaint")
def salary_complaint_form():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_margins(20, 20, 20)

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "SALARY COMPLAINT FORM", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, "Government Labour Department — Nivedan Portal", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 6, "Form Ref: SAL-COMPLAINT-001  |  Date: ____________", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    def section(title: str):
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(0, 8, f"  {title}", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

    def field(label: str, lines: int = 1):
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(60, 7, f"{label}:", new_x="RIGHT", new_y="TOP")
        for _ in range(lines):
            pdf.cell(0, 7, "_" * 55, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

    section("1. COMPLAINANT DETAILS")
    field("Full Name")
    field("Phone Number")
    field("Email Address")
    field("Residential Address", lines=2)
    pdf.ln(4)

    section("2. EMPLOYER DETAILS")
    field("Employer / Company Name")
    field("Employer Address", lines=2)
    field("Nature of Business")
    pdf.ln(4)

    section("3. EMPLOYMENT DETAILS")
    field("Date of Joining (DD/MM/YYYY)")
    field("Designation / Job Role")
    field("Last Working Day (if applicable)")
    pdf.ln(4)

    section("4. SALARY DISPUTE DETAILS")
    field("Monthly Salary (INR)")
    field("Number of Months Unpaid")
    field("Total Amount Owed (INR)")
    field("Last Salary Received Date")
    field("Mode of Payment")
    pdf.ln(4)

    section("5. DECLARATION")
    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(
        0, 6,
        "I hereby declare that the information provided above is true and correct to the best "
        "of my knowledge. I understand that providing false information is a punishable offence "
        "under the relevant labour laws.",
    )
    pdf.ln(8)
    pdf.cell(80, 6, "Complainant Signature: _____________", new_x="RIGHT", new_y="TOP")
    pdf.cell(0, 6, "Date: ______________", new_x="LMARGIN", new_y="NEXT")

    return send_file(
        io.BytesIO(bytes(pdf.output())),
        mimetype="application/pdf",
        download_name="salary_complaint_form.pdf",
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
