import os
from functools import wraps

import jwt
from bson import ObjectId
from flask import g, jsonify, request

from db import db


def jwt_required(f):
    """Decorator that validates Bearer JWT and sets g.user to the MongoDB user doc."""

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization header missing or malformed"}), 401

        token = auth_header[len("Bearer "):]
        try:
            payload = jwt.decode(
                token,
                os.getenv("JWT_SECRET", ""),
                algorithms=["HS256"],
            )
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        user = db.users.find_one({"_id": ObjectId(payload["user_id"])})
        if not user:
            return jsonify({"error": "User not found"}), 401

        g.user = user
        return f(*args, **kwargs)

    return decorated
