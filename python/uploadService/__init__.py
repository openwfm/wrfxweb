from uploadService.app import db, app

from uploadService.utils import upload_key_required
from uploadService.logging import utils as loggingUtils

from api.validators import CatalogValidators as CatalogValidators
from api.validators import (
    CatalogEntryUploadValidators as CatalogEntryUploadValidators,
)
from api.services import (
    CatalogEntryUploadServices as CatalogEntryUploadServices,
)
from api.services import CatalogServices as CatalogServices
from api.serializers import CatalogEntrySerializer as CatalogEntrySerializer

from flask import request, abort
import zipfile
import os

with app.app_context():
    db.create_all()


@app.route("/catalogs/<catalog_id>/entries", methods=["POST"])
@upload_key_required
def catalog_entries(catalog_id):
    if request.method == "POST":
        return create_catalog_entry(catalog_id)
    return {
        "message": "Method Not Allowed",
    }, 405


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
