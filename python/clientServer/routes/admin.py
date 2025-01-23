from ..app import app, db

from .validators import CatalogValidators as CatalogValidators
from ..services import AdminServices as AdminServices
from ..services import CatalogServices as CatalogServices
from ..services import CatalogEntryServices as CatalogEntryServices
from ..services import CatalogAccessServices as CatalogAccessServices
from ..serializers import UserSerializer as UserSerializer
from ..serializers import CatalogSerializer as CatalogSerializer
from ..serializers import CatalogEntrySerializer as CatalogEntrySerializer
from ..serializers import CatalogAccessSerializer as CatalogAccessSerializer
from ..models.User import User
from ..models.Admin import Admin

from flask import redirect, url_for, render_template, request, session
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

    return {
        "catalogs": CatalogSerializer.serialize_catalogs_with_permissions(catalogs)
    }, 200


@app.route("/admin/catalogs/<catalog_id>", methods=["DELETE", "PATCH"])
@admin_login_required
def catalog_id(catalog_id):
    if request.method == "DELETE":
        return delete_catalog_id(catalog_id)
    elif request.method == "PATCH":
        return update_catalog_id(catalog_id)
    return {
        "message": "Method Not Allowed",
    }, 405


def delete_catalog_id(catalog_id):
    CatalogServices.destroy(int(catalog_id))
    return {
        "message": "Catalog Successfully Deleted!",
    }, 200


def update_catalog_id(catalog_id):
    catalog_id = CatalogValidators.validate_catalog_id(catalog_id)
    catalog_params = CatalogValidators.validate_catalog_params(request.get_json())

    updated_catalog = CatalogServices.update(catalog_id, catalog_params)
    return {
        "message": "Catalog Successfully Updated!",
        "catalog": CatalogSerializer.serialize_catalog_with_permissions(
            updated_catalog
        ),
    }, 200


def create_catalog_access_for_user(catalog_id, email):
    CatalogAccessServices.create_for_user(int(catalog_id), email)
    return {
        "message": "Catalog Access Created!",
    }, 200


def delete_catalog_access_for_user(catalog_id, email):
    CatalogAccessServices.destroy_for_user(int(catalog_id), email)
    return {
        "message": "Catalog Access Deleted!",
    }, 200


def create_catalog_access_for_domain(catalog_id, domain):
    CatalogAccessServices.create_for_domain(int(catalog_id), domain)
    return {
        "message": "Catalog Access Created!",
    }, 200


def delete_catalog_access_for_domain(catalog_id, domain):
    CatalogAccessServices.destroy_for_domain(int(catalog_id), domain)
    return {
        "message": "Catalog Access Deleted!",
    }, 200


@app.route(
    "/admin/catalogs/<catalog_id>/permissions/all",
    methods=["GET"],
)
@admin_login_required
def get_catalog_accessess(catalog_id):
    catalog_accesses = CatalogAccessServices.find_all(int(catalog_id))
    return {
        "permissions": CatalogAccessSerializer.serialize_accesses(catalog_accesses)
    }, 200


@app.route("/admin/catalogs", methods=["POST"])
@admin_login_required
def create_catalog():
    catalog_params = CatalogValidators.validate_catalog_params(request.get_json())

    created_catalog = CatalogServices.create(catalog_params)
    return {
        "message": "Catalog Successfully Created!",
        "catalog": CatalogSerializer.serialize_catalog_with_permissions(
            created_catalog
        ),
    }, 200


@app.route("/admin/catalogs/<catalog_id>/entries", methods=["GET", "POST"])
@admin_login_required
def catalog_entries(catalog_id):
    if request.method == "GET":
        return get_catalog_entries(catalog_id)
    elif request.method == "POST":
        return create_catalog_entry(catalog_id)
    return {
        "message": "Method Not Allowed",
    }, 405


def get_catalog_entries(catalog_id):
    catalog_id = CatalogValidators.validate_catalog_id(catalog_id)
    catalog = CatalogServices.find_by_id(catalog_id)
    return {
        "entries": CatalogEntrySerializer.serialize_entries(catalog.entries),
    }, 200


def create_catalog_entry(catalog_id):
    # catalog_id = CatalogValidators.validate_catalog_id(catalog_id)
    # raw_catalog_entry_params = request.get_json()
    # print(f"raw params {raw_catalog_entry_params}")
    # catalog_entry_params = CatalogValidators.validate_catalog_entry(request.get_json())
    # files = request.files
    # print(f"files {files}")
    # CatalogEntryServices.create(catalog_id, catalog_entry_params)
    # catalog = CatalogServices.find_by_id(catalog_id)
    print("=========== Create Entry Success ===========")
    return {
        "message": "Entry Successfully Created!",
        # "catalog": CatalogSerializer.serialize_catalog_with_permissions(catalog),
    }, 200


@app.route("/admin")
@admin_login_required
def admin_index():
    return render_template("admin/admin_panel.html")


@app.route("/admin/reset_sessions")
@admin_login_required
def reset_sessions():
    session.clear()
    return {"message": "Sessions Successfully Reset!"}, 200
