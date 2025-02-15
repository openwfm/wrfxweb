from clientServer.app import app

from clientServer.routes.admin.admin_utils import admin_login_required
from clientServer.logging import utils as loggingUtils

from clientServer.validators import CatalogValidators as CatalogValidators
from clientServer.validators import (
    CatalogEntryUploadValidators as CatalogEntryUploadValidators,
)
from clientServer.services import (
    CatalogEntryUploadServices as CatalogEntryUploadServices,
)
from clientServer.services import CatalogServices as CatalogServices
from clientServer.serializers import CatalogEntrySerializer as CatalogEntrySerializer

from flask import request, abort
import zipfile
import os


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
        "entries": CatalogEntrySerializer.serialize_catalog_entries(catalog.entries),
    }, 200


def create_catalog_entry(catalog_id):
    try:
        zip_file = request.files["zipFile"]
        entry_form = request.form["column"]
        catalog_entry_params = {
            "catalog_id": catalog_id,
            "zip_file": zip_file,
            "entry_type": entry_form,
        }
        validated_catalog_entry_params = (
            CatalogEntryUploadValidators.validate_catalog_entry_upload(
                catalog_entry_params
            )
        )
        catalog_entry_upload = CatalogEntryUploadServices.create(
            validated_catalog_entry_params
        )
        verify_zip_upload(catalog_entry_upload)
    except Exception as e:
        abort(400, f"An error occurred while uploading file: {e}")

    return {
        "message": "Entry Successfully Created!",
    }, 200


def verify_zip_upload(catalog_entry_upload):
    upload_path = catalog_entry_upload.upload_path()
    try:
        with zipfile.ZipFile(upload_path) as zip_ref:
            zip_ref.testzip()
    except zipfile.BadZipFile:
        os.remove(upload_path)
        catalog_entry_upload.destroy()

        abort(400, "Corrupted Zip File")
