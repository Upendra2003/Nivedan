from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, g, jsonify, request

from db import db
from services.auth_middleware import jwt_required

notifications_bp = Blueprint("notifications", __name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    doc["user_id"] = str(doc["user_id"])
    if "complaint_id" in doc and doc["complaint_id"]:
        doc["complaint_id"] = str(doc["complaint_id"])
    if "created_at" in doc and hasattr(doc["created_at"], "isoformat"):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


# ---------------------------------------------------------------------------
# GET /notifications/mine  — unread notifications for current user
# ---------------------------------------------------------------------------

@notifications_bp.route("/mine", methods=["GET"])
@jwt_required
def list_notifications():
    notes = list(
        db.notifications
        .find({"user_id": g.user["_id"], "read": False})
        .sort("created_at", -1)
    )
    return jsonify([_serialize(n) for n in notes]), 200


# ---------------------------------------------------------------------------
# POST /notifications/read/<id>  — mark notification as read
# ---------------------------------------------------------------------------

@notifications_bp.route("/read/<notification_id>", methods=["POST"])
@jwt_required
def mark_read(notification_id: str):
    try:
        oid = ObjectId(notification_id)
    except Exception:
        return jsonify({"error": "invalid id"}), 400

    result = db.notifications.update_one(
        {"_id": oid, "user_id": g.user["_id"]},
        {"$set": {"read": True}},
    )
    if result.matched_count == 0:
        return jsonify({"error": "not found"}), 404

    return jsonify({"ok": True}), 200
