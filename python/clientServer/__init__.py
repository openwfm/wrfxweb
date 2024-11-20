from .app import create_app, db
from flask import (
    render_template,
    send_from_directory,
    url_for,
    redirect,
    session,
    request,
)
from dotenv import load_dotenv
import os
from authlib.integrations.flask_client import OAuth
from functools import wraps

from .models.Users import User

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
FLASK_SECRET = os.getenv("FLASK_SECRET")


app = create_app()

app.secret_key = FLASK_SECRET

with app.app_context():
    db.create_all()

oauth = OAuth(app)
google = oauth.register(
    name="google",
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid profile email"},
)


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


@app.route("/create_user", methods=["POST"])
def create_user():
    json = request.get_json()
    username = json["user"]
    password = json["password"]
    contact = json["contact"]
    full_name = json["fullName"]
    organization = json["organization"]
    date = datetime.datetime.now().strftime("%Y-%m-%d")

    user_username = User.query.filter_by(username=username).first()
    if user_username:
        return {"message": "User already exists with username"}, 409
    user_contact = User.query.filter_by(contact=contact).first()
    if user_contact:
        return {"message": "User already exists with contact"}, 409

    new_user = User(
        username=username,
        contact=contact,
        full_name=full_name,
        organization=organization,
        date_created=date,
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    session["username"] = new_user.username
    return redirect(url_for("index"))


@app.route("/login/google", methods=["POST"])
def google_login():
    try:
        redirect_uri = url_for("authorize_google", _external=True)
        # auth = google.authorize_redirect(redirect_uri)
        return google.authorize_redirect(redirect_uri)
        # print(f"auth: {auth}")
        return {"auth": auth}
        # return {"test": "test"}
    except Exception as e:
        return {"message": "Error logging in with Google: " + str(e)}, 401


@app.route("/authorize/google", methods=["GET"])
def authorize_google():
    print(" ==== authorize_google ====")
    token = google.authorize_access_token()
    userinfo_endpoint = google.server_metadata["userinfo_endpoint"]
    resp = google.get(userinfo_endpoint)
    user_info = resp.json()
    contact = user_info["email"]
    user = User.query.filter_by(contact=contact).first()
    if not user:
        user = User(
            username=user_info["email"],
            contact=user_info["email"],
            full_name=user_info["name"],
            organization="",
            date_created=datetime.datetime.now().strftime("%Y-%m-%d"),
        )
        db.session.add(user)
        db.session.commit()
    session["username"] = user.username
    session["oauth_token"] = token

    return redirect(url_for("index"))


@app.route("/login/submit", methods=["POST"])
def login():
    json = request.get_json()
    username = json["user"]
    password = json["password"]
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        session["username"] = user.username
        return redirect(url_for("index"))
    return {"message": "Login failed"}, 401


@app.route("/login", methods=["GET"])
def login_page():
    return render_template("login.html")
