from clientServer.app import app

from clientServer.serverKeys import ADMIN_UPLOADS_FOLDER
from clientServer.logging import utils as loggingUtils

from .admin_utils import admin_login_required

from clientServer.validators import CatalogValidators as CatalogValidators
from clientServer.services import CatalogEntryServices as CatalogEntryServices
from clientServer.services import CatalogServices as CatalogServices
from clientServer.serializers import CatalogEntrySerializer as CatalogEntrySerializer

from flask import request


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
    catalog_id = CatalogValidators.validate_catalog_id(catalog_id)
    zipFile = request.files["zipFile"]
    loggingUtils.debug_log(f"formData: {request.form.to_dict()}")

    if zipFile.filename != "":
        zipFile.save(f"{ADMIN_UPLOADS_FOLDER}/{zipFile.filename}")

    # catalog_entry_params = CatalogValidators.validate_catalog_entry(request.get_json())
    # CatalogEntryServices.create(catalog_id, catalog_entry_params)
    # catalog = CatalogServices.find_by_id(catalog_id)
    return {
        "message": "Entry Successfully Created!",
        # "catalog": CatalogSerializer.serialize_catalog_with_permissions(catalog),
    }, 200
