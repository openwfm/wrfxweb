from clientServer.app import app, db

from clientServer.routes.admin.admin_utils import admin_login_required
from clientServer.routes.admin import catalogs, catalog_permissions, catalog_entries

from clientServer.serverKeys import ADMIN_SERVICES_API_KEY

from api.services import AdminServices as AdminServices
from api.serializers import UserSerializer as UserSerializer
from api.models.User import User
from api.models.Admin import Admin


from flask import render_template, request, session
from flask_login import current_user


@app.route("/admin/all", methods=["GET"])
@admin_login_required
def all_admins():
    admins = db.session.query(User).join(Admin).all()
    admin_jsons = [
        UserSerializer.serialize_user_with_email(
            admin, current_user, ADMIN_SERVICES_API_KEY
        )
        for admin in admins
    ]

    return {"admins": admin_jsons}, 200


@app.route("/admin/create", methods=["POST"])
@admin_login_required
def create_admin():
    json = request.get_json()
    email = json["email"]
    created_admin_user = AdminServices.admin_create(
        email, current_user, ADMIN_SERVICES_API_KEY
    )
    return {
        "message": "Admin Successfully Created!",
        "admin": UserSerializer.serialize_user_with_email(
            created_admin_user, current_user, ADMIN_SERVICES_API_KEY
        ),
    }, 200


@app.route("/admin/delete/", methods=["DELETE"])
@admin_login_required
def delete_admin():
    json = request.get_json()
    email = json["email"]
    AdminServices.destroy(email)

    return {"message": "admin deleted"}, 200


@app.route("/admin")
@admin_login_required
def admin_index():
    return render_template("admin/admin_panel.html")


@app.route("/admin/reset_sessions")
@admin_login_required
def reset_sessions():
    session.clear()
    return {"message": "Sessions Successfully Reset!"}, 200
