from uploadService.app import app
from uploadService.utils import api_key_required
from uploadService.uploadServiceKeys import (
    UPLOAD_SERVICE_API_KEY,
    UPLOAD_QUEUE_SERVICE_URL,
    UPLOAD_QUEUE_SERVICE_API_KEY,
)
import uploadService.logging.utils as loggingUtils

from api.services import (
    CatalogEntryUploadServices as CatalogEntryUploadServices,
)
from api.services import (
    CatalogEntryServices as CatalogEntryServices,
)
from api.services import (
    CatalogEntryCatalogServices as CatalogEntryCatalogServices,
)
from api.services import (
    UploadToCatalogServices as UploadToCatalogServices,
)
from api.services import CatalogServices as CatalogServices
from api.serializers import CatalogEntrySerializer as CatalogEntrySerializer


from flask import request, abort
import requests
import zipfile
import os


@app.route("/catalogs/<catalog_id>/entries", methods=["GET", "POST"])
@api_key_required
def catalog_entries(catalog_id):
    if request.method == "GET":
        return get_catalog_entries(catalog_id)
    elif request.method == "POST":
        return create_catalog_entry(catalog_id)
    return {
        "message": "Method Not Allowed",
    }, 405


@app.route("/entries/<catalog_id>", methods=["POST"])
# @api_key_required
def catalog_entry_catalog(catalog_id):
    if request.method == "POST":
        return {
            "message": "Success",
        }, 200
        # return create_catalog_entry_catalog(request.get_json(), catalog_id)
    return {
        "message": "Method Not Allowed",
    }, 405


def create_catalog_entry_catalog(json, catalog_id):
    if "job_id" not in json:
        abort(400, "Request missing job_id")
    return {"message": "Success"}, 200


def get_catalog_entries(catalog_id):
    catalog_entries = CatalogEntryServices.external_entries(
        catalog_id, UPLOAD_SERVICE_API_KEY
    )
    return {
        "entries": CatalogEntrySerializer.serialize_catalog_entries(catalog_entries),
    }, 200


def create_catalog_entry(catalog_id):
    try:
        zip_file = request.files["zipFile"]
        entry_form = request.form["column"]
        catalog_entry_params = {
            "zip_file": zip_file,
            "entry_type": entry_form,
            "uploader_id": 0,
        }
        catalog_entry_upload = CatalogEntryUploadServices.create(
            catalog_entry_params, UPLOAD_SERVICE_API_KEY
        )
        if catalog_entry_upload == None:
            abort(400, f"An error occurred while uploading file")

        verify_zip_upload(catalog_entry_upload)

        upload_to_catalog_params = {
            "catalog_entry_upload_id": catalog_entry_upload.id,
            "catalog_id": catalog_id,
        }
        UploadToCatalogServices.find_or_create(
            upload_to_catalog_params, UPLOAD_SERVICE_API_KEY
        )
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
