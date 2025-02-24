from clientServer.app import app

from clientServer.routes.admin.admin_utils import admin_login_required, api_key_required
from clientServer.logging import utils as loggingUtils
from clientServer.serverKeys import (
    UPLOAD_QUEUE_SERVICE_URL,
    UPLOAD_QUEUE_SERVICE_API_KEY,
)

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
import requests
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


@app.route("/upload_service/catalogs/<catalog_id>/entries", methods=["POST"])
@api_key_required
def external_catalog_entries(catalog_id):
    if request.method == "POST":
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

    loggingUtils.log_upload(catalog_entry_upload)
    post_task_queue_service(catalog_entry_upload)

    return {
        "message": "Entry Successfully Created!",
    }, 200


def post_task_queue_service(catalog_entry_upload):
    post_url = f"{UPLOAD_QUEUE_SERVICE_URL}/enqueue/{catalog_entry_upload.id}"
    try:
        headers = {
            "Content-type": "application/json",
            "API-Key": UPLOAD_QUEUE_SERVICE_API_KEY,
        }
        response = requests.post(post_url, headers=headers)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        loggingUtils.log_upload_queue_error(catalog_entry_upload, f"{e}")


def verify_zip_upload(catalog_entry_upload):
    upload_path = catalog_entry_upload.upload_path()
    try:
        with zipfile.ZipFile(upload_path) as zip_ref:
            zip_ref.testzip()
    except zipfile.BadZipFile:
        os.remove(upload_path)
        catalog_entry_upload.destroy()

        abort(400, "Corrupted Zip File")
