from flask import Blueprint, request, jsonify, g
from services.auth_middleware import jwt_required
from services.agent_runner import run_agent

agent_bp = Blueprint("agent", __name__)


@agent_bp.route("/message", methods=["POST"])
@jwt_required
def agent_message():
    data = request.get_json() or {}
    complaint_id = (data.get("complaint_id") or "").strip()
    message = (data.get("message") or "").strip()

    if not complaint_id:
        return jsonify({"error": "complaint_id is required"}), 400

    try:
        result = run_agent(complaint_id, message, g.user)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
