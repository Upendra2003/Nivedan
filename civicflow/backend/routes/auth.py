import os
import re
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from bson import ObjectId
from flask import Blueprint, g, jsonify, request

from db import db
from models.user import SUPPORTED_LANGUAGES, user_schema
from services.auth_middleware import jwt_required

auth_bp = Blueprint("auth", __name__)

_EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, os.getenv("JWT_SECRET", ""), algorithm="HS256")


def _serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "preferred_language": user.get("preferred_language", "en"),
    }


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------

@auth_bp.route("/register", methods=["POST"])
def register():
    body = request.get_json(silent=True) or {}

    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    phone = (body.get("phone") or "").strip()
    preferred_language = body.get("preferred_language", "en")

    if not all([name, email, password, phone]):
        return jsonify({"error": "name, email, password, and phone are required"}), 400

    if not _EMAIL_RE.fullmatch(email):
        return jsonify({"error": "invalid email format"}), 400

    if preferred_language not in SUPPORTED_LANGUAGES:
        return jsonify({
            "error": f"preferred_language must be one of: {', '.join(sorted(SUPPORTED_LANGUAGES))}"
        }), 400

    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    if db.users.find_one({"phone": phone}):
        return jsonify({"error": "Phone number already registered"}), 409

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    doc = user_schema(name, email, phone, password_hash, preferred_language)
    result = db.users.insert_one(doc)
    doc["_id"] = result.inserted_id

    token = _make_token(str(result.inserted_id))
    return jsonify({"token": token, "user": _serialize_user(doc)}), 201


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------

@auth_bp.route("/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}

    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = db.users.find_one({"email": email})
    if not user or not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid email or password"}), 401

    token = _make_token(str(user["_id"]))
    return jsonify({"token": token, "user": _serialize_user(user)}), 200


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

@auth_bp.route("/me", methods=["GET"])
@jwt_required
def me():
    return jsonify(_serialize_user(g.user)), 200


# ---------------------------------------------------------------------------
# PATCH /auth/me  — update mutable profile fields (preferred_language)
# ---------------------------------------------------------------------------

@auth_bp.route("/me", methods=["PATCH"])
@jwt_required
def update_me():
    data = request.get_json(silent=True) or {}
    preferred_language = data.get("preferred_language")

    if preferred_language is not None:
        if preferred_language not in SUPPORTED_LANGUAGES:
            return jsonify({
                "error": f"preferred_language must be one of: {', '.join(sorted(SUPPORTED_LANGUAGES))}"
            }), 400
        db.users.update_one(
            {"_id": g.user["_id"]},
            {"$set": {"preferred_language": preferred_language}},
        )
        updated = db.users.find_one({"_id": g.user["_id"]})
        return jsonify(_serialize_user(updated)), 200

    return jsonify({"error": "no updatable fields provided"}), 400
