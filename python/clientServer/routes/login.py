from ..app import app, db
from ..models.User import User
from ..serverKeys import CLIENT_ID, CLIENT_SECRET, OAUTH_REDIRECT_URI, ENVIRONMENT
from ..services import UserServices as UserServices

from flask import request, redirect, url_for, session, render_template, flash, abort
from flask_login import login_user, logout_user, current_user, LoginManager
from functools import wraps
from urllib.parse import urlencode

import secrets
import requests


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


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if current_user.is_anonymous:
            return redirect(url_for("login_page"))
        else:
            return f(*args, **kwargs)

    return wrapper


@app.route("/login/google")
def google_login():
    if not current_user.is_anonymous:
        return redirect(url_for("index"))

    # generate a random string for the state parameter
    session["oauth2_state"] = secrets.token_urlsafe(16)

    # create a query string with all the OAuth2 parameters
    redirect_url = url_for("authorize_google", _external=True)
    if ENVIRONMENT == "production":
        redirect_url = f"{OAUTH_REDIRECT_URI}/authorize/google"
    qs = urlencode(
        {
            "client_id": provider_data["client_id"],
            "redirect_uri": redirect_url,
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
    user = UserServices.find_or_create(email)
    time_now = datetime.datetime.now().strftime("%Y-%m-%d:%H-%M-%S")
    app.logger.info(f"[Login] {user.email} {time_now}")

    # log the user in
    login_user(user)
    return redirect(url_for("index"))


@app.route("/login", methods=["GET"])
def login_page():
    return render_template("login.html")


@app.route("/logout")
def logout():
    logout_user()
    flash("You have been logged out.")
    return redirect(url_for("login_page"))
