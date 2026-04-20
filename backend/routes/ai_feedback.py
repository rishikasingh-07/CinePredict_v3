from flask import Blueprint, request, jsonify
from services.gemini_service import get_ai_suggestions

ai_bp = Blueprint("ai_feedback", __name__)


@ai_bp.route("/ai-feedback", methods=["POST"])
def ai_feedback():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        result = get_ai_suggestions(data)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
