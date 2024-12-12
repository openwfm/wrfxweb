from ..app import app, db
from ..models.User import User
from ..serverKeys import OAUTH_REDIRECT_URI, ENVIRONMENT

from flask import request, redirect, url_for, session, render_template, flash, abort
from flask_login import login_user, logout_user, current_user
from functools import wraps
from urllib.parse import urlencode

import secrets
import requests
import datetime


def admin_login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if current_user.is_anonymous:
            return redirect(url_for("login_page"))
        else:
            return f(*args, **kwargs)

    return wrapper


@app.route("/admin/authorize/google", methods=["GET"])
def admin_authorize_google():
    pass


@app.route("/admin/create_admin")
def create_admin():
    pass


def delete_admin():
    pass


@app.route("/admin")
@admin_login_required
def admin_index():
    return render_template("admin_panel.html")
