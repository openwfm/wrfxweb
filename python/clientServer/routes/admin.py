from ..app import app, db

from ..services import AdminServices as AdminServices
from ..serializers import UserSerializer as UserSerializer
from ..models.User import User
from ..models.Admin import Admin

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


@app.route("/admin/all", methods=["GET"])
@admin_login_required
def all_admins():
    admins = db.session.query(User).join(Admin).all()
    admin_jsons = [UserSerializer.serialize_user(admin) for admin in admins]

    return {"admins": admin_jsons}, 200


@app.route("/admin/create", methods=["POST"])
@admin_login_required
def create_admin():
    json = request.get_json()
    email = json["email"]
    created_admin_user = AdminServices.create(email)
    return {
        "message": "Admin Successfully Created!",
        "admin": UserSerializer.serialize_user(created_admin_user),
    }, 200


@app.route("/admin/delete/", methods=["DELETE"])
@admin_login_required
def delete_admin():
    json = request.get_json()
    email = json["email"]
    AdminServices.destroy(email)

    return {"message": "admin deleted"}, 200


@app.route("/admin/simulation_catalogs", methods=["GET"])
@admin_login_required
def simulation_catalogs():
    return {"message": "simulation catalogs"}, 200


@app.route("/admin")
@admin_login_required
def admin_index():
    return render_template("admin/admin_panel.html")
