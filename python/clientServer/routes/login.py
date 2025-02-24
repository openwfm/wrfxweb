from clientServer.app import app
from clientServer.serverKeys import (
    CLIENT_SECRETS_FILE,
    OAUTH_SCOPES,
)
from api.db import db
from api.models.User import User
from api.services import UserServices as UserServices
from clientServer.logging import utils as loggingUtils

from flask import request, redirect, url_for, session, render_template, flash
from flask_login import login_user, logout_user, current_user, LoginManager
from functools import wraps

import google.oauth2.credentials
import google_auth_oauthlib.flow
from googleapiclient.discovery import build

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


# https://developers.google.com/identity/protocols/oauth2/web-server#python_1
@app.route("/login/google")
def google_login():
    if not current_user.is_anonymous:
        return redirect(url_for("index"))

    # create a query string with all the OAuth2 parameters
    redirect_url = url_for("authorize_google", _external=True)

    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=OAUTH_SCOPES
    )
    flow.redirect_uri = redirect_url

    loggingUtils.debug_log_login(f"redirect_url: {redirect_url}")

    authorization_url, state = flow.authorization_url(
        # Recommended, enable offline access so that you can refresh an access token without
        # re-prompting the user for permission. Recommended for web server apps.
        access_type="offline",
        # Optional, enable incremental authorization. Recommended as a best practice.
        include_granted_scopes="true",
        # Optional, set prompt to 'consent' will prompt the user for consent
        # prompt="consent",
    )
    loggingUtils.debug_log_login(f"authorization_url: {authorization_url}")

    # generate a random string for the state parameter
    session["oauth2_state"] = state

    # redirect the user to the OAuth2 provider authorization URL
    return redirect(authorization_url)


@app.route("/authorize/google", methods=["GET"])
def authorize_google():
    if not current_user.is_anonymous:
        return redirect(url_for("index"))

    state = session["oauth2_state"]

    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=OAUTH_SCOPES, state=state
    )
    request_url = url_for("authorize_google", _external=True)
    flow.redirect_uri = request_url

    # Use the authorization server's response to fetch the OAuth 2.0 tokens.
    authorization_response = request.url
    flow.fetch_token(authorization_response=authorization_response)
    loggingUtils.debug_log_auth(f"request_url: {request_url}")
    loggingUtils.debug_log_auth(f"authorization_response_url: {authorization_response}")

    # Store credentials in the session.
    credentials = flow.credentials
    credentials = credentials

    user_info_service = build("oauth2", "v2", credentials=credentials)
    user_info = user_info_service.userinfo().get().execute()
    email = user_info["email"]

    # find or create the user in the database
    user = UserServices.find_or_create(email)

    loggingUtils.log_login(f"{user.id}")

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
