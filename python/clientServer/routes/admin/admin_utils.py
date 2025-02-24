from clientServer.serverKeys import EXTERNAL_API_KEY, ADMIN_SERVICES_API_KEY
from api.services import AdminServices as AdminServices

from flask import redirect, url_for, request
from flask_login import current_user
from functools import wraps


def admin_login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if current_user.is_anonymous:
            return redirect(url_for("login_page"))
        elif not AdminServices.isAdmin(current_user, ADMIN_SERVICES_API_KEY):
            return redirect(url_for("index"))
        else:
            return f(*args, **kwargs)

    return wrapper


def api_key_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        api_key = request.headers.get("API-Key")
        if api_key == None:
            return {"message": "Missing API key"}, 401
        if api_key == EXTERNAL_API_KEY:
            return f(*args, **kwargs)
        return {"message": "Invalid API key"}, 401

    return wrapper
