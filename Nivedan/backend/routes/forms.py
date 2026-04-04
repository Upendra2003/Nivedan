import os

import requests
from flask import Blueprint, Response, jsonify, request

from services.auth_middleware import jwt_required
from services.pdf_generator import generate_pdf_b64

forms_bp = Blueprint("forms", __name__)

_PORTAL_URL = lambda: os.getenv("MOCK_PORTAL_URL", "http://localhost:5001")


# ---------------------------------------------------------------------------
# GET /forms/<form_name>
# Proxy to mock portal and return the PDF bytes.
# ---------------------------------------------------------------------------

@forms_bp.route("/<form_name>", methods=["GET"])
def get_form(form_name: str):
    try:
        resp = requests.get(
            f"{_PORTAL_URL()}/portal/forms/{form_name}",
            timeout=5,
        )
        resp.raise_for_status()
    except Exception as e:
        return jsonify({"error": f"Could not fetch form from portal: {e}"}), 502

    return Response(
        resp.content,
        status=resp.status_code,
        content_type=resp.headers.get("Content-Type", "application/pdf"),
    )


# ---------------------------------------------------------------------------
# POST /forms/generate
# Generate a filled PDF from form_data and return base64.
# ---------------------------------------------------------------------------

@forms_bp.route("/generate", methods=["POST"])
@jwt_required
def generate_form():
    data = request.get_json(silent=True) or {}
    form_name = (data.get("form_name") or "").strip()
    form_data = data.get("form_data") or {}

    if not form_name:
        return jsonify({"error": "form_name is required"}), 400

    try:
        pdf_b64 = generate_pdf_b64(form_name, form_data)
    except Exception as e:
        return jsonify({"error": f"PDF generation failed: {e}"}), 500

    return jsonify({"pdf_base64": pdf_b64}), 200
