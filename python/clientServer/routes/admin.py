from ..app import app

from ..services import AdminServices as AdminServices

from flask import redirect, url_for, render_template, request
from flask_login import current_user
from functools import wraps


def admin_login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if current_user.is_anonymous:
            return redirect(url_for("login_page"))
        elif not AdminServices.isAdmin(current_user):
            return redirect(url_for("index"))
        else:
            return f(*args, **kwargs)

    return wrapper


@app.route("/admin/create", methods=["POST"])
@admin_login_required
def create_admin():
    json = request.get_json()
    email = json["email"]
    created_admin = AdminServices.create(email)
    return {"message": "Admin Successfully Created!"}, 200


@app.route("/admin/delete_admin")
@admin_login_required
def delete_admin():
    json = request.get_json()
    email = json["email"]
    return {"message": "Not implemented"}, 501


@app.route("/admin")
@admin_login_required
def admin_index():
    return render_template("admin/admin_panel.html")
