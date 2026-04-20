from flask import Blueprint, request, jsonify
from services.prediction_service import predict_movie_success
from utils.helpers import calculate_confidence

predict_bp = Blueprint("predict", __name__)


@predict_bp.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        confidence = calculate_confidence(data)
        prediction = predict_movie_success(data)
        prediction["confidence"] = confidence

        return jsonify(prediction), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
