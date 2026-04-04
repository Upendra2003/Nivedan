from flask import Blueprint, g, jsonify, request

from db import db
from services.auth_middleware import jwt_required

users_bp = Blueprint("users", __name__)


# ---------------------------------------------------------------------------
# POST /users/push_token
# Save Expo push token to user document.
# ---------------------------------------------------------------------------

@users_bp.route("/push_token", methods=["POST"])
@jwt_required
def save_push_token():
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()

    if not token:
        return jsonify({"error": "token is required"}), 400

    db.users.update_one(
        {"_id": g.user["_id"]},
        {"$set": {"push_token": token}},
    )
    return jsonify({"ok": True}), 200
