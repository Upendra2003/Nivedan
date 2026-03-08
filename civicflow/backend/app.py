from dotenv import load_dotenv
load_dotenv()  # must happen before any module that reads os.getenv (db, routes)

from flask import Flask
from flask_cors import CORS
from routes.auth import auth_bp
from routes.complaints import complaints_bp
from routes.forms import forms_bp
from routes.notifications import notifications_bp
from routes.users import users_bp
from routes.webhooks import webhooks_bp
from routes.agent import agent_bp

app = Flask(__name__)
CORS(app)

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
    app.run(host="0.0.0.0", port=5000, debug=True)
