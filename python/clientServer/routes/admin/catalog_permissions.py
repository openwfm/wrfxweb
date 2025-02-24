from clientServer.app import app

from clientServer.routes.admin.admin_utils import admin_login_required

from api.services import CatalogAccessServices as CatalogAccessServices
from api.serializers import CatalogAccessSerializer as CatalogAccessSerializer


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
