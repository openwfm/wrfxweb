from ..app import app, db
from ..models.Users import User
from ..serverKeys import CLIENT_ID, CLIENT_SECRET

from flask import request, redirect, url_for, session, render_template, flash, abort
from flask_login import LoginManager, login_user, logout_user, current_user

from urllib.parse import urlencode
import secrets
import requests
import datetime


provider_data = {
    "client_id": CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "authorize_url": "https://accounts.google.com/o/oauth2/auth",
    "token_url": "https://accounts.google.com/o/oauth2/token",
    "userinfo": {
        "url": "https://www.googleapis.com/oauth2/v3/userinfo",
        "email": lambda json: json["email"],
    },
    "scopes": ["https://www.googleapis.com/auth/userinfo.email"],
}
login = LoginManager(app)


@login.user_loader
def load_user(id):
    return db.session.get(User, int(id))


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


@app.route("/login/google")
def google_login():
    if not current_user.is_anonymous:
        return redirect(url_for("index"))

    # generate a random string for the state parameter
    session["oauth2_state"] = secrets.token_urlsafe(16)

    # create a query string with all the OAuth2 parameters
    qs = urlencode(
        {
            "client_id": provider_data["client_id"],
            "redirect_uri": url_for("authorize_google", _external=True),
            "response_type": "code",
            "scope": " ".join(provider_data["scopes"]),
            "state": session["oauth2_state"],
        }
    )

    # redirect the user to the OAuth2 provider authorization URL
    return redirect(provider_data["authorize_url"] + "?" + qs)


@app.route("/authorize/google", methods=["GET"])
def authorize_google():
    if not current_user.is_anonymous:
        return redirect(url_for("index"))

    # if there was an authentication error, flash the error messages and exit
    if "error" in request.args:
        for k, v in request.args.items():
            if k.startswith("error"):
                flash(f"{k}: {v}")
        return redirect(url_for("index"))

    # make sure that the state parameter matches the one we created in the
    # authorization request
    if request.args["state"] != session.get("oauth2_state"):
        abort(401)

    # make sure that the authorization code is present
    if "code" not in request.args:
        abort(401)

    # exchange the authorization code for an access token
    response = requests.post(
        provider_data["token_url"],
        data={
            "client_id": provider_data["client_id"],
            "client_secret": provider_data["client_secret"],
            "code": request.args["code"],
            "grant_type": "authorization_code",
            "redirect_uri": url_for("authorize_google", _external=True),
        },
        headers={"Accept": "application/json"},
    )
    if response.status_code != 200:
        abort(401)
    oauth2_token = response.json().get("access_token")
    if not oauth2_token:
        abort(401)

    # use the access token to get the user's email address
    response = requests.get(
        provider_data["userinfo"]["url"],
        headers={
            "Authorization": "Bearer " + oauth2_token,
            "Accept": "application/json",
        },
    )
    if response.status_code != 200:
        abort(401)
    email = provider_data["userinfo"]["email"](response.json())

    # find or create the user in the database
    user = db.session.scalar(db.select(User).where(User.email == email))
    if user is None:
        date = datetime.datetime.now().strftime("%Y-%m-%d")
        user = User(email=email, username=email.split("@")[0], date_created=date)
        db.session.add(user)
        db.session.commit()

    # log the user in
    login_user(user)
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


@app.route("/logout")
def logout():
    logout_user()
    flash("You have been logged out.")
    return redirect(url_for("login_page"))
