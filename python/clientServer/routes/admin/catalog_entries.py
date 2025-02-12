from clientServer.app import app

from clientServer.serverKeys import ADMIN_UPLOADS_FOLDER
from clientServer.logging import utils as loggingUtils

from .admin_utils import admin_login_required

from clientServer.validators import CatalogValidators as CatalogValidators
from clientServer.validators import CatalogEntryValidators as CatalogEntryValidators
from clientServer.services import CatalogEntryServices as CatalogEntryServices
from clientServer.services import CatalogServices as CatalogServices
from clientServer.serializers import CatalogEntrySerializer as CatalogEntrySerializer

from flask import request
from flask_login import current_user


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
    catalog = CatalogValidators.validate_catalog(catalog_id)
    return {
        "entries": CatalogEntrySerializer.serialize_entries(catalog.entries),
    }, 200


def create_catalog_entry(catalog_id):
    zipFile = request.files["zipFile"]
    catalog_entry_params = {"catalog_id": catalog_id, "zip_file": zipFile}
    validated_catalog_entry_params = CatalogEntryValidators.validate_catalog_entry(
        catalog_entry_params
    )
    catalog_entry = CatalogEntryServices.create(validated_catalog_entry_params)

    return {
        "message": "Entry Successfully Created!",
        "catalog": CatalogEntrySerializer.serialize_catalog_entry(catalog_entry),
    }, 200
