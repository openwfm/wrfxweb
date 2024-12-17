from .app import db, app
from .serverKeys import CLIENT_SERVER_SECRET, API_URL
from . import routes
from .routes.login import login_required

from flask import render_template
import requests

app.secret_key = CLIENT_SERVER_SECRET

with app.app_context():
    db.create_all()


@app.route("/")
@login_required
def index():
    return render_template("index.html")


@app.route("/api/<path:api_path>")
def serve_api(api_path):
    response = requests.get(f"{API_URL}/{api_path}")

    if response.status_code == 200:
        data = response.json()
        return data
    else:
        return {"error": "API request failed"}, 500
