import base64
import os
from datetime import datetime, timezone

import requests
from bson import ObjectId
from flask import Blueprint, g, jsonify, request

from db import db
from models.complaint import complaint_schema
from services.auth_middleware import jwt_required

complaints_bp = Blueprint("complaints", __name__)

# Statuses managed exclusively by the portal webhook — never settable by end users
_PORTAL_ONLY_STATUSES = frozenset({"filed", "acknowledged", "under_review", "next_step", "resolved"})
# Statuses that end users are permitted to set (e.g. cancel → pending, mark failed)
_USER_SETTABLE_STATUSES = frozenset({"pending", "failed"})


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize(doc: dict) -> dict:
    """Convert ObjectId fields and datetime to JSON-safe types."""
    doc["_id"] = str(doc["_id"])
    doc["user_id"] = str(doc["user_id"])
    doc.pop("pdf_bytes", None)
    for key in ("created_at", "updated_at"):
        if key in doc and hasattr(doc[key], "isoformat"):
            doc[key] = doc[key].isoformat()
    for entry in doc.get("timeline", []):
        if "timestamp" in entry and hasattr(entry["timestamp"], "isoformat"):
            entry["timestamp"] = entry["timestamp"].isoformat()
    return doc


def _call_portal(complaint_id: str, user_id: str, category: str,
                 subcategory: str, form_data: dict, pdf_base64: str) -> dict:
    portal_url = os.getenv("MOCK_PORTAL_URL", "http://localhost:5001")
    payload = {
        "complaint_id": complaint_id,
        "user_id": user_id,
        "category": category,
        "subcategory": subcategory,
        "form_data": form_data,
        "pdf_base64": pdf_base64,
    }
    resp = requests.post(f"{portal_url}/portal/submit", json=payload, timeout=5)
    resp.raise_for_status()
    return resp.json()


# ---------------------------------------------------------------------------
# POST /complaints/create
# ---------------------------------------------------------------------------

@complaints_bp.route("/create", methods=["POST"])
@jwt_required
def create_complaint_v2():
    data = request.get_json(silent=True) or {}
    category = (data.get("category") or "").strip()
    subcategory = (data.get("subcategory") or "").strip()

    if not category or not subcategory:
        return jsonify({"error": "category and subcategory are required"}), 400

    # Sanitize form_data — cap fields and value length to prevent unbounded BSON growth
    raw_form = data.get("form_data") or {}
    form_data = {
        str(k)[:100]: str(v)[:2000]
        for k, v in raw_form.items()
        if isinstance(k, str) and isinstance(v, (str, int, float))
    }
    if len(form_data) > 50:
        form_data = dict(list(form_data.items())[:50])

    doc = complaint_schema(
        user_id=str(g.user["_id"]),
        category=category,
        subcategory=subcategory,
        form_data=form_data,
    )
    doc["user_id"] = g.user["_id"]
    now = _now()
    doc["timeline"].append({"timestamp": now, "event": "Complaint created", "detail": ""})
    result = db.complaints.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify(_serialize(doc)), 201


# ---------------------------------------------------------------------------
# GET /complaints/  — list user's complaints
# ---------------------------------------------------------------------------

@complaints_bp.route("/", methods=["GET"])
@jwt_required
def list_complaints():
    items = list(db.complaints.find({"user_id": g.user["_id"]}).sort("created_at", -1))
    return jsonify([_serialize(i) for i in items]), 200


# ---------------------------------------------------------------------------
# GET /complaints/<id>
# ---------------------------------------------------------------------------

@complaints_bp.route("/<complaint_id>", methods=["GET"])
@jwt_required
def get_complaint(complaint_id: str):
    try:
        oid = ObjectId(complaint_id)
    except Exception:
        return jsonify({"error": "invalid id"}), 400

    complaint = db.complaints.find_one({"_id": oid, "user_id": g.user["_id"]})
    if not complaint:
        return jsonify({"error": "not found"}), 404

    return jsonify(_serialize(complaint)), 200


# ---------------------------------------------------------------------------
# POST /complaints/<id>/submit_to_portal
# ---------------------------------------------------------------------------

@complaints_bp.route("/<complaint_id>/submit_to_portal", methods=["POST"])
@jwt_required
def submit_to_portal_route(complaint_id: str):
    try:
        oid = ObjectId(complaint_id)
    except Exception:
        return jsonify({"error": "invalid id"}), 400

    complaint = db.complaints.find_one({"_id": oid, "user_id": g.user["_id"]})
    if not complaint:
        return jsonify({"error": "not found"}), 404

    data = request.get_json(silent=True) or {}
    pdf_base64 = (data.get("pdf_base64") or "").strip()
    if not pdf_base64:
        return jsonify({"error": "pdf_base64 is required"}), 400

    try:
        portal_result = _call_portal(
            complaint_id=complaint_id,
            user_id=str(complaint["user_id"]),
            category=complaint.get("category", ""),
            subcategory=complaint.get("subcategory", ""),
            form_data=complaint.get("form_data") or complaint.get("details") or {},
            pdf_base64=pdf_base64,
        )
    except Exception as e:
        return jsonify({"error": f"Portal submission failed: {e}"}), 502

    portal_ref_id = portal_result.get("portal_ref_id", "")
    now = _now()
    db.complaints.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": "filed",
                "portal_ref_id": portal_ref_id,
                "updated_at": now,
            },
            "$push": {
                "timeline": {
                    "timestamp": now,
                    "event": "Submitted to portal",
                    "detail": f"Ref: {portal_ref_id}",
                }
            },
        },
    )
    return jsonify({"ok": True, "portal_ref_id": portal_ref_id, "status": "filed"}), 200


# ---------------------------------------------------------------------------
# POST /complaints/<id>/resubmit
# ---------------------------------------------------------------------------

@complaints_bp.route("/<complaint_id>/resubmit", methods=["POST"])
@jwt_required
def resubmit_complaint(complaint_id: str):
    try:
        oid = ObjectId(complaint_id)
    except Exception:
        return jsonify({"error": "invalid id"}), 400

    complaint = db.complaints.find_one({"_id": oid, "user_id": g.user["_id"]})
    if not complaint:
        return jsonify({"error": "not found"}), 404

    data = request.get_json(silent=True) or {}
    pdf_base64 = (data.get("pdf_base64") or "").strip()
    changes_summary = (data.get("changes_summary") or "").strip()
    if not pdf_base64:
        return jsonify({"error": "pdf_base64 is required"}), 400

    try:
        portal_result = _call_portal(
            complaint_id=complaint_id,
            user_id=str(complaint["user_id"]),
            category=complaint.get("category", ""),
            subcategory=complaint.get("subcategory", ""),
            form_data=complaint.get("form_data") or complaint.get("details") or {},
            pdf_base64=pdf_base64,
        )
    except Exception as e:
        return jsonify({"error": f"Portal resubmission failed: {e}"}), 502

    portal_ref_id = portal_result.get("portal_ref_id", "")
    now = _now()
    db.complaints.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": "filed",
                "portal_ref_id": portal_ref_id,
                "updated_at": now,
            },
            "$inc": {"resubmission_count": 1},
            "$push": {
                "timeline": {
                    "timestamp": now,
                    "event": "Resubmitted to portal",
                    "detail": changes_summary or f"Ref: {portal_ref_id}",
                }
            },
        },
    )
    return jsonify({"ok": True, "portal_ref_id": portal_ref_id, "status": "filed"}), 200


# ---------------------------------------------------------------------------
# PATCH /complaints/<id>/status
# ---------------------------------------------------------------------------

@complaints_bp.route("/<complaint_id>/status", methods=["PATCH"])
@jwt_required
def update_status(complaint_id: str):
    try:
        oid = ObjectId(complaint_id)
    except Exception:
        return jsonify({"error": "invalid id"}), 400

    data = request.get_json(silent=True) or {}
    new_status = (data.get("status") or "").strip()
    if not new_status:
        return jsonify({"error": "status is required"}), 400
    if new_status in _PORTAL_ONLY_STATUSES:
        return jsonify({"error": "status is managed by the portal"}), 403
    if new_status not in _USER_SETTABLE_STATUSES:
        return jsonify({"error": f"invalid status '{new_status}'"}), 400

    now = _now()
    result = db.complaints.update_one(
        {"_id": oid, "user_id": g.user["_id"]},
        {
            "$set": {"status": new_status, "updated_at": now},
            "$push": {"timeline": {"event": f"Status updated to {new_status}", "timestamp": now}},
        },
    )
    if result.matched_count == 0:
        return jsonify({"error": "complaint not found or not authorized"}), 404
    return jsonify({"ok": True}), 200


# ---------------------------------------------------------------------------
# DELETE /complaints/<id>  — only allowed when status is "pending"
# ---------------------------------------------------------------------------

@complaints_bp.route("/<complaint_id>", methods=["DELETE"])
@jwt_required
def delete_complaint(complaint_id: str):
    try:
        oid = ObjectId(complaint_id)
    except Exception:
        return jsonify({"error": "invalid id"}), 400

    try:
        user_oid = g.user["_id"]
        # Match both ObjectId and legacy string user_id formats
        complaint = db.complaints.find_one({
            "_id": oid,
            "$or": [{"user_id": user_oid}, {"user_id": str(user_oid)}],
        })
        if not complaint:
            return jsonify({"error": "complaint not found"}), 404

        if complaint.get("status") != "pending":
            return jsonify({"error": "only pending complaints can be deleted"}), 403

        result = db.complaints.delete_one({
            "_id": oid,
            "$or": [{"user_id": user_oid}, {"user_id": str(user_oid)}],
            "status": "pending",
        })
        if result.deleted_count == 0:
            return jsonify({"error": "complaint could not be deleted — status may have changed"}), 409

        return jsonify({"ok": True}), 200

    except Exception as exc:
        return jsonify({"error": f"server error: {exc}"}), 500


# ---------------------------------------------------------------------------
# POST /complaints/<id>/upload-doc
# ---------------------------------------------------------------------------

_ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
    "application/pdf",
}
_MAX_SUPPORTING_DOCS = 10


@complaints_bp.route("/<complaint_id>/upload-doc", methods=["POST"])
@jwt_required
def upload_document(complaint_id: str):
    """Store a signature or supporting document (base64) on the complaint."""
    try:
        oid = ObjectId(complaint_id)
    except Exception:
        return jsonify({"error": "invalid id"}), 400

    complaint = db.complaints.find_one({"_id": oid, "user_id": g.user["_id"]})
    if not complaint:
        return jsonify({"error": "not found"}), 404

    data      = request.get_json(silent=True) or {}
    doc_type  = (data.get("type") or "").strip()
    file_b64  = (data.get("file_base64") or "").strip()
    filename  = (data.get("filename") or "document")[:200]
    mime_type = (data.get("mime_type") or "").strip().lower()[:100]

    # Validate type
    if doc_type not in ("signature", "supporting"):
        return jsonify({"error": "type must be 'signature' or 'supporting'"}), 400
    if not file_b64:
        return jsonify({"error": "file_base64 is required"}), 400
    if len(file_b64) > 1_200_000:  # ~900 KB decoded — matches mobile MAX_B64
        return jsonify({"error": "file too large (max ~900 KB)"}), 413

    # HIGH-1: server-side MIME allowlist — client restrictions are not a security boundary
    if mime_type not in _ALLOWED_MIME_TYPES:
        return jsonify({"error": f"unsupported file type '{mime_type}'. Allowed: jpeg, png, gif, webp, pdf"}), 415

    now = _now()
    if doc_type == "signature":
        db.complaints.update_one(
            {"_id": oid},
            {"$set": {"signature_b64": file_b64, "updated_at": now}},
        )
    else:
        # HIGH-2: cap supporting docs to prevent unbounded BSON growth
        existing_count = len(complaint.get("supporting_docs") or [])
        if existing_count >= _MAX_SUPPORTING_DOCS:
            return jsonify({"error": f"maximum {_MAX_SUPPORTING_DOCS} supporting documents allowed"}), 400
        db.complaints.update_one(
            {"_id": oid},
            {
                "$push": {"supporting_docs": {
                    "filename":  filename,
                    "file_b64":  file_b64,
                    "mime_type": mime_type,
                }},
                "$set": {"updated_at": now},
            },
        )
    return jsonify({"ok": True}), 200
