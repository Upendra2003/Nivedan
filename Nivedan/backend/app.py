import os
from dotenv import load_dotenv
load_dotenv()  # must happen before any module that reads os.getenv (db, routes)

# C-3: Fail loudly if JWT_SECRET is missing — empty secret makes all tokens forgeable
if not os.getenv("JWT_SECRET"):
    raise RuntimeError("JWT_SECRET environment variable is not set. Refusing to start.")

# LOW-2: Warn if WEBHOOK_SECRET is unset — webhooks will accept all requests without verification
if not os.getenv("WEBHOOK_SECRET"):
    import warnings
    warnings.warn("WEBHOOK_SECRET is not set — webhook endpoint accepts unauthenticated requests.", stacklevel=1)

from flask import Flask, jsonify
from flask_cors import CORS
from routes.auth import auth_bp
from routes.complaints import complaints_bp
from routes.forms import forms_bp
from routes.notifications import notifications_bp
from routes.users import users_bp
from routes.webhooks import webhooks_bp
from routes.agent import agent_bp

app = Flask(__name__)
CORS(app, methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])

# Always return JSON for errors — never HTML (prevents JSON.parse failures on the client)
@app.errorhandler(400)
@app.errorhandler(401)
@app.errorhandler(403)
@app.errorhandler(404)
@app.errorhandler(405)
@app.errorhandler(409)
@app.errorhandler(500)
def json_error(e):
    code = e.code if hasattr(e, "code") else 500
    return jsonify({"error": str(e)}), code

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(complaints_bp, url_prefix="/complaints")
app.register_blueprint(forms_bp, url_prefix="/forms")
app.register_blueprint(notifications_bp, url_prefix="/notifications")
app.register_blueprint(users_bp, url_prefix="/users")
app.register_blueprint(webhooks_bp, url_prefix="/webhooks")
app.register_blueprint(agent_bp, url_prefix="/agent")

if __name__ == "__main__":
    # host="0.0.0.0" makes Flask accept connections from the whole LAN,
    # not just localhost — required for Expo Go on a physical device.
    app.run(host="0.0.0.0", port=5000, debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")
