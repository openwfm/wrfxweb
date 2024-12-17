from ..app import app

from flask import redirect, url_for, render_template
from flask_login import current_user
from functools import wraps


def admin_login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if current_user.is_anonymous:
            return redirect(url_for("login_page"))
        elif not current_user.is_admin():
            return redirect(url_for("index"))
        else:
            return f(*args, **kwargs)

    return wrapper


@app.route("/admin/create_admin")
@admin_login_required
def create_admin():
    return {"message": "Not implemented"}, 501


@app.route("/admin/delete_admin")
@admin_login_required
def delete_admin():
    return {"message": "Not implemented"}, 501


@app.route("/admin")
@admin_login_required
def admin_index():
    return render_template("admin_panel.html")
