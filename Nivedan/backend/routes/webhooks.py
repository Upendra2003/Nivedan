import hmac
import os
from datetime import datetime, timezone

import requests
from bson import ObjectId
from flask import Blueprint, jsonify, request

from db import db

webhooks_bp = Blueprint("webhooks", __name__)

WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")
VALID_STATUSES = {"pending", "filed", "acknowledged", "under_review", "next_step", "resolved", "failed"}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _send_expo_push(token: str, title: str, body: str, data: dict | None = None) -> None:
    """Fire-and-forget Expo push notification."""
    try:
        requests.post(
            "https://exp.host/--/api/v2/push/send",
            json={"to": token, "title": title, "body": body, "data": data or {}, "sound": "default"},
            timeout=5,
        )
    except Exception as exc:
        print(f"[push] delivery failed for token {token[:20]}...: {exc}")


# ---------------------------------------------------------------------------
# POST /webhooks/portal
# Called by mock portal on status change (next_step / abort).
# Body: { complaint_id, portal_ref_id, status, reason, next_step_label }
# ---------------------------------------------------------------------------

@webhooks_bp.route("/portal", methods=["POST"])
def portal_webhook():
    # C-1: Verify shared secret if one is configured
    if WEBHOOK_SECRET:
        incoming = request.headers.get("X-Webhook-Secret", "")
        if not hmac.compare_digest(incoming, WEBHOOK_SECRET):
            return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}

    complaint_id = data.get("complaint_id")
    portal_ref_id = data.get("portal_ref_id", "")
    new_status = data.get("status")
    reason = data.get("reason", "")
    next_step_label = data.get("next_step_label", "")

    if not complaint_id or not new_status:
        return jsonify({"error": "complaint_id and status are required"}), 400

    # C-2: Validate status against allowlist
    if new_status not in VALID_STATUSES:
        return jsonify({"error": f"invalid status '{new_status}'"}), 400

    try:
        oid = ObjectId(complaint_id)
    except Exception:
        return jsonify({"error": "invalid complaint_id"}), 400

    complaint = db.complaints.find_one({"_id": oid})
    if not complaint:
        return jsonify({"error": "complaint not found"}), 404

    event_label = next_step_label or reason or new_status
    now = _now()

    update = {
        "$set": {
            "status": new_status,
            "current_step_label": next_step_label or "",
            "updated_at": now,
        },
        "$push": {
            "timeline": {
                "timestamp": now,
                "event": event_label,
                "detail": reason or "",
            }
        },
    }
    if portal_ref_id:
        update["$set"]["portal_ref_id"] = portal_ref_id
    if new_status == "failed":
        update["$set"]["agent_state"] = "REJECTED"
        if reason:
            update["$set"]["rejection_reason"] = reason

    db.complaints.update_one({"_id": oid}, update)

    # Create notification
    user_id = complaint["user_id"]
    message = (
        f"Your complaint status has been updated to: {next_step_label or new_status}"
        + (f" — {reason}" if reason else "")
    )
    notification_doc = {
        "user_id": user_id,
        "complaint_id": oid,
        "message": message,
        "type": new_status,
        "read": False,
        "created_at": now,
    }
    db.notifications.insert_one(notification_doc)

    # Send Expo push if user has push_token
    user = db.users.find_one({"_id": user_id})
    push_token = (user or {}).get("push_token")
    if push_token:
        _send_expo_push(
            token=push_token,
            title="Nivedan Update",
            body=message,
            data={
                "type": "status_update",
                "complaint_id": complaint_id,
                "status": new_status,
                "next_step_label": next_step_label,
                "reason": reason,
            },
        )

    return jsonify({"ok": True, "complaint_id": complaint_id, "status": new_status}), 200
