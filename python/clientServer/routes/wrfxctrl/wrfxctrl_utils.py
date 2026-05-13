from api.services import AdminServices as AdminServices
from api.services import WrfxctrlAccessServices as WrfxctrlAccessServices

from clientServer.serverKeys import WRFXCTRL_API_KEY

from flask import redirect, url_for, request
from flask_login import current_user
from functools import wraps


def wrfxctrl_access_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            if current_user.is_anonymous:
                return redirect(url_for("login_page"))
            elif not WrfxctrlAccessServices.user_has_access(current_user):
                return redirect(url_for("index"))
            else:
                return f(*args, **kwargs)
        except:
            return redirect(url_for("index"))

    return wrapper


def wrfxctrl_api_key_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        api_key = request.headers.get("API-Key")
        if api_key == None:
            return {"message": "Missing API key"}, 403
        if api_key == WRFXCTRL_API_KEY:
            return f(*args, **kwargs)
        return {"message": "Invalid API key"}, 401

    return wrapper
