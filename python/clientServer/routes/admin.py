from ..app import app, db

from ..services import AdminServices as AdminServices
from ..services import CatalogServices as CatalogServices
from ..services import CatalogAccessServices as CatalogAccessServices
from ..serializers import UserSerializer as UserSerializer
from ..serializers import CatalogSerializer as CatalogSerializer
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


@app.route("/admin/catalogs/all", methods=["GET"])
@admin_login_required
def simulation_catalogs():
    catalogs = CatalogServices.find_all()

    return {"catalogs": CatalogSerializer.serialize_catalogs(catalogs)}, 200


@app.route("/admin/catalogs/delete/<catalog_id>", methods=["DELETE"])
@admin_login_required
def delete_catalog_id(catalog_id):
    CatalogServices.destroy(int(catalog_id))
    return {
        "message": "Catalog Successfully Deleted!",
    }, 200


@app.route(
    "/admin/catalogs/<catalog_id>/permissions/create/users/<email>",
    methods=["POST"],
)
@admin_login_required
def create_catalog_access_for_user(catalog_id, email):
    CatalogAccessServices.create_for_user(int(catalog_id), email)
    return {
        "message": "Catalog Access Created!",
    }, 200


@app.route(
    "/admin/catalogs/<catalog_id>/permissions/create/users/<email>",
    methods=["POST"],
)
@admin_login_required
def create_catalog_access_for_domain(catalog_id, domain):
    CatalogAccessServices.create_for_domain(int(catalog_id), domain)
    return {
        "message": "Catalog Access Created!",
    }, 200


@app.route(
    "/admin/catalogs/<catalog_id>/permissions/delete/users/<user_id>",
    methods=["DELETE"],
)
@admin_login_required
def delete_catalog_access_for_user(catalog_id, user_id):
    CatalogAccessServices.destroy_for_user(int(catalog_id), int(user_id))
    return {
        "message": "Catalog Access Deleted!",
    }, 200


@app.route(
    "/admin/catalogs/<catalog_id>/permissions/delete/domain/<domain>",
    methods=["DELETE"],
)
@admin_login_required
def delete_catalog_access_for_domain(catalog_id, domain):
    CatalogAccessServices.destroy_for_domain(int(catalog_id), domain)
    return {
        "message": "Catalog Successfully Deleted!",
    }, 200


@app.route("/admin/catalogs/create", methods=["POST"])
@admin_login_required
def create_catalog():
    json = request.get_json()
    name = json["name"]
    description = json["description"]

    created_catalog = CatalogServices.create(name, description)
    return {
        "message": "Catalog Successfully Created!",
        "catalog": CatalogSerializer.serialize_catalog(created_catalog),
    }, 200


@app.route("/admin")
@admin_login_required
def admin_index():
    return render_template("admin/admin_panel.html")
