from .app import db, app
from .serverKeys import CLIENT_SECRET
from flask import (
    render_template,
    send_from_directory,
    url_for,
    redirect,
    session,
    request,
)

from authlib.integrations.flask_client import OAuth

# from flask_oauthlib.client import OAuth
from functools import wraps
from .routes.login import login

app.secret_key = CLIENT_SECRET

with app.app_context():
    db.create_all()


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "google_id" not in session:
            return redirect(url_for("login_page"))
        else:
            return f(*args, **kwargs)

    return wrapper


@app.route("/")
@login_required
def index():
    return render_template("index.html")


@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory("../../fdds/js", filename)


@app.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory("../../fdds/css", filename)


@app.route("/simulations/<path:filename>")
def serve_simulations(filename):
    return send_from_directory("../../fdds/simulations", filename)


@app.route("/threadManager.js")
def serve_thread_manager():
    return send_from_directory("../../fdds", "threadManager.js")


@app.route("/conf")
def serve_conf():
    return send_from_directory("../../fdds", "conf.json")


@app.route("/catalog", methods=["GET"])
def catalog():
    return {"catalogUrl": "simulations/catalog.json"}


@app.route("/submit_issue", methods=["POST"])
def submit_issue():
    json = request.get_json()
    featureOrBug = int(json["featureOrBug"])
    title = json["title"]
    description = json["description"]
    steps = json["steps"]
    contact = json["contact"]
    full_name = json["fullName"]
    organization = json["organization"]
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    if feedback_counts[date] >= 100:
        print("Daily feedback limit reached.")
        return {
            "message": "Daily feedback limit reached. Please try again tomorrow."
        }, 429
    return {"message": "success"}
