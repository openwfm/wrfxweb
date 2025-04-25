from clientServer.services import AdminServices as AdminServices

from flask import redirect, url_for
from flask_login import current_user
from functools import wraps


def admin_login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        print(f"admin login: {current_user}")
        print(AdminServices.isAdmin(current_user))
        if current_user.is_anonymous:
            return redirect(url_for("login_page"))
        elif not AdminServices.isAdmin(current_user):
            return redirect(url_for("index"))
        else:
            return f(*args, **kwargs)

    return wrapper
