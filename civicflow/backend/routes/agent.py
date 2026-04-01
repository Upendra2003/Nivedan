import json as json_module
import logging

from bson import ObjectId
from flask import Blueprint, request, jsonify, g
from db import db
from services.auth_middleware import jwt_required
from services.agent_runner import run_agent
from services.sarvam import chat_completion

agent_bp = Blueprint("agent", __name__)
logger = logging.getLogger(__name__)

_MAX_MESSAGE_LEN = 4000  # ~3 000 tokens — prevents cost amplification

_THINKING_SYSTEM = (
    "You are an AI legal assistant for Indian citizens. "
    "Given the user's message and their case context, list exactly 3 short thinking steps "
    "(max 7 words each) that you would mentally perform before responding. "
    "Steps must be specific to this message — not generic. "
    "Return ONLY a valid JSON array of 3 strings, nothing else. "
    'Example: ["Reviewing salary payment timeline", "Checking Labour Act provisions", "Identifying next required field"]'
)


@agent_bp.route("/message", methods=["POST"])
@jwt_required
def agent_message():
    data = request.get_json() or {}
    complaint_id = (data.get("complaint_id") or "").strip()
    message = (data.get("message") or "").strip()

    if not complaint_id:
        return jsonify({"error": "complaint_id is required"}), 400
    if len(message) > _MAX_MESSAGE_LEN:
        return jsonify({"error": "message too long (max 4 000 characters)"}), 400

    try:
        result = run_agent(complaint_id, message, g.user)
        return jsonify(result), 200
    except Exception:
        logger.exception("agent_message failed for complaint %s", complaint_id)
        return jsonify({"error": "An internal error occurred. Please try again."}), 500


@agent_bp.route("/thinking", methods=["POST"])
@jwt_required
def agent_thinking():
    """Return model-generated thinking steps for a user message.

    The frontend calls this in parallel with /agent/message and shows the steps
    while holding the actual response back for a minimum display duration.
    This creates a transparent chain-of-thought UX.
    """
    data = request.get_json() or {}
    complaint_id = (data.get("complaint_id") or "").strip()
    message = (data.get("message") or "").strip()

    if not message:
        return jsonify({"steps": ["Analyzing your message", "Reviewing case details", "Preparing response"]}), 200

    try:
        # Build context from complaint
        context_parts = []
        if complaint_id:
            try:
                complaint = db.complaints.find_one({"_id": ObjectId(complaint_id)})
                if complaint:
                    context_parts.append(f"Case type: {complaint.get('subcategory', 'general')}")
                    context_parts.append(f"Stage: {complaint.get('agent_state', 'CHAT')}")
                    if complaint.get("form_data"):
                        filled = [k for k, v in complaint["form_data"].items() if v]
                        if filled:
                            context_parts.append(f"Collected fields: {', '.join(filled[:4])}")
            except Exception:
                pass

        context = "; ".join(context_parts) if context_parts else "general complaint"
        user_content = f"Context: {context}\nUser message: {message}"

        raw = chat_completion([{"role": "user", "content": user_content}], _THINKING_SYSTEM)

        # Extract JSON array from response (model may include preamble text)
        raw = raw.strip()
        start = raw.find("[")
        end   = raw.rfind("]") + 1
        if start != -1 and end > start:
            raw = raw[start:end]

        steps = json_module.loads(raw)
        if not isinstance(steps, list) or not steps:
            raise ValueError("invalid response")

        steps = [str(s).strip() for s in steps[:4] if str(s).strip()]

    except Exception:
        logger.exception("agent_thinking failed for complaint %s", complaint_id)
        steps = ["Analyzing your message", "Reviewing case details", "Preparing response"]

    return jsonify({"steps": steps}), 200
