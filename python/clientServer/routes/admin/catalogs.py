from clientServer.app import app
from clientServer.serverKeys import ADMIN_SERVICES_API_KEY

from clientServer.logging import utils as loggingUtils
from clientServer.routes.admin.admin_utils import admin_login_required

from api.validators import CatalogValidators as CatalogValidators
from api.services import CatalogServices as CatalogServices
from api.serializers import CatalogSerializer as CatalogSerializer

from flask import request
from flask_login import current_user


@app.route("/admin/catalogs/all", methods=["GET"])
@admin_login_required
def simulation_catalogs():
    catalogs = CatalogServices.admin_catalogs(current_user, ADMIN_SERVICES_API_KEY)

    return {
        "catalogs": CatalogSerializer.serialize_catalogs_with_permissions(
            catalogs, current_user, ADMIN_SERVICES_API_KEY
        )
    }, 200


@app.route("/admin/catalogs", methods=["POST"])
@admin_login_required
def create_catalog():
    created_catalog = CatalogServices.create(
        request.get_json(), current_user, ADMIN_SERVICES_API_KEY
    )

    return {
        "message": "Catalog Successfully Created!",
        "catalog": CatalogSerializer.serialize_catalog_with_permissions(
            created_catalog, current_user, ADMIN_SERVICES_API_KEY
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
    CatalogServices.destroy(catalog_id, current_user, ADMIN_SERVICES_API_KEY)
    return {
        "message": "Catalog Successfully Deleted!",
    }, 200


def update_catalog_id(catalog_id):
    updated_catalog = CatalogServices.update(
        catalog_id, request.get_json(), current_user, ADMIN_SERVICES_API_KEY
    )
    return {
        "message": "Catalog Successfully Updated!",
        "catalog": CatalogSerializer.serialize_catalog_with_permissions(
            updated_catalog, current_user, ADMIN_SERVICES_API_KEY
        ),
    }, 200
