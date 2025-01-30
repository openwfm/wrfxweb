from ...app import app

from .admin_utils import admin_login_required

from ...services import CatalogServices as CatalogServices
from ...serializers import CatalogSerializer as CatalogSerializer
from ..validators import CatalogValidators as CatalogValidators

from flask import request


@app.route("/admin/catalogs/all", methods=["GET"])
@admin_login_required
def simulation_catalogs():
    catalogs = CatalogServices.find_all()

    return {
        "catalogs": CatalogSerializer.serialize_catalogs_with_permissions(catalogs)
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
