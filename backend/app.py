import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from routes.predict import predict_bp
from routes.ai_feedback import ai_bp

app = Flask(__name__)

allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*")
CORS(app, resources={r"/*": {"origins": allowed_origins}})

app.register_blueprint(predict_bp)
app.register_blueprint(ai_bp)

@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok", "message": "Movie Predictor API is running"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true")
