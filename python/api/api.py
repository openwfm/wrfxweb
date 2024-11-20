from flask import Flask, request, url_for, session, redirect, render_template
import bcrypt
from dotenv import load_dotenv
import sqlite3
import datetime
from collections import defaultdict
import os
from authlib.integrations.flask_client import OAuth
from flask_sqlalchemy import SQLAlchemy

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
FLASK_SECRET = os.getenv("FLASK_SECRET")

USER_FEEDBACK_DATABASE = "user_feedback.db"

template_dir = os.path.abspath("../fdds")

app = Flask(__name__, template_folder=template_dir)
app.secret_key = FLASK_SECRET

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(25), unique=True, nullable=False)
    password_hash = db.Column(db.String(100), nullable=False)
    contact = db.Column(db.String(100), unique=True, nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    organization = db.Column(db.String(100), nullable=False)
    date_created = db.Column(db.String(10), nullable=False)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    def check_password(self, password):
        return bcrypt.checkpw(password.encode("utf-8"), self.password_hash)


with app.app_context():
    db.create_all()


feedback_counts = defaultdict(int)

oauth = OAuth(app)

google = oauth.register(
    name="google",
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid profile email"},
)


@app.route("/api/catalog", methods=["GET"])
def catalog():
    return {"catalogUrl": "simulations/catalog.json"}


@app.route("/api/submit_issue", methods=["POST"])
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
    try:
        with sqlite3.connect(USER_FEEDBACK_DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO user_feedback (date, full_name, organization, contact, type, title, description, steps) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    date,
                    full_name,
                    organization,
                    contact,
                    featureOrBug,
                    title,
                    description,
                    steps,
                ),
            )
            conn.commit()
            msg = "Issue successfully submitted"
    except Exception as e:
        print("Error Submitting Issue:", str(e))
        conn.rollback()
        msg = "Error submitting issue: " + str(e)
    finally:
        conn.close()
        feedback_counts[date] += 1
        return {"message": msg}


@app.route("/api/create_user", methods=["POST"])
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
    return redirect(url_for("catalog"))


@app.route("/api/google_login", methods=["POST"])
def google_login():
    try:
        redirect_uri = url_for("authorize_google", _external=True)
        auth = google.authorize_redirect(redirect_uri)
        # return google.authorize_redirect(redirect_uri)
        # print(f"auth: {auth}")
        return {"auth": auth}
        # return {"test": "test"}
    except Exception as e:
        return {"message": "Error logging in with Google: " + str(e)}, 401


@app.route("/api/authorize/google", methods=["GET"])
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

    return redirect(url_for("catalog"))


@app.route("/api/login", methods=["POST"])
def login():
    json = request.get_json()
    username = json["user"]
    password = json["password"]
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        session["username"] = user.username
        return redirect(url_for("catalog"))
    return {"message": "Login failed"}, 401
