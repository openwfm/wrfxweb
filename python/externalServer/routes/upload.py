from externalServer.app import app

from externalServer.utils import api_key_required, universal_api_key_required
from externalServer.logging import utils as loggingUtils
from externalServer.serverKeys import (
    UPLOAD_QUEUE_SERVICE_URL,
    UPLOAD_QUEUE_SERVICE_API_KEY,
    UPLOAD_SERVICE_API_KEY,
)

from api.validators import (
    CatalogEntryUploadValidators as CatalogEntryUploadValidators,
    CatalogValidators as CatalogValidators,
)
from api.services import (
    CatalogEntryUploadServices as CatalogEntryUploadServices,
    CatalogEntryServices as CatalogEntryServices,
    UploadToCatalogServices as UploadToCatalogServices,
)


from api.serializers import CatalogEntrySerializer as CatalogEntrySerializer

from flask import request, abort
import requests
import zipfile
import os

LOGGING_AREA = "UploadRoutes"


@app.route("/entries/catalogs/<catalog_id>", methods=["GET"])
@api_key_required
def catalog_entries(catalog_id):
    if request.method == "GET":
        return get_catalog_entries(catalog_id)
    return {
        "message": "Method Not Allowed",
    }, 405


@app.route("/entries/upload", methods=["POST"])
@universal_api_key_required
def entries():
    if request.method == "POST":
        return upload_catalog_entry()
    return {
        "message": "Method Not Allowed",
    }, 405


def get_catalog_entries(catalog_id):
    catalog_entries = CatalogEntryServices.external_entries(
        catalog_id, UPLOAD_SERVICE_API_KEY
    )
    return {
        "entries": CatalogEntrySerializer.serialize_catalog_entries(catalog_entries),
    }, 200


def upload_catalog_entry():
    try:
        upload_params = verify_upload_params()

        catalog_entry_upload = upload_zip(upload_params)
        if catalog_entry_upload == None:
            return {"message": "An error occurred while uploading file"}, 400
        for catalog_id in upload_params["catalog_ids"]:
            upload_to_catalog_params = {
                "catalog_entry_upload_id": catalog_entry_upload.id,
                "catalog_id": catalog_id,
            }
            UploadToCatalogServices.find_or_create(
                upload_to_catalog_params, UPLOAD_SERVICE_API_KEY
            )
        log_upload(catalog_entry_upload)
        post_task_queue_service(catalog_entry_upload)
    except Exception as e:
        loggingUtils.error_log(LOGGING_AREA, e)
        return {"message": "An error occurred while uploading file"}, 400

    return {
        "message": "Entry Successfully Created!",
    }, 200


def verify_upload_params():
    try:
        zip_file = request.files["zipFile"]
        column = request.form["column"]
        catalog_ids = []
        if "catalog_ids" in request.form:
            catalog_ids = request.form["catalog_ids"].split(" ")
            for catalog_id in catalog_ids:
                if not catalog_id.isdigit():
                    abort(500, "catalog_ids must be a space separated list of ints")
        return {"zip_file": zip_file, "column": column, "catalog_ids": catalog_ids}
    except:
        abort(500, "Must provide a zipFile and column parameter")


def upload_zip(upload_params):
    zip_file = upload_params["zip_file"]
    entry_type = upload_params["column"]
    catalog_entry_params = {
        "zip_file": zip_file,
        "entry_type": entry_type,
        "uploader_id": 0,
    }
    catalog_entry_upload = CatalogEntryUploadServices.create(
        catalog_entry_params, UPLOAD_SERVICE_API_KEY
    )
    if catalog_entry_upload == None:
        return None
    verify_zip_upload(catalog_entry_upload)

    return catalog_entry_upload


def verify_zip_upload(catalog_entry_upload):
    upload_path = catalog_entry_upload.upload_path()
    try:
        with zipfile.ZipFile(upload_path) as zip_ref:
            zip_ref.testzip()
    except zipfile.BadZipFile:
        os.remove(upload_path)
        catalog_entry_upload.destroy()

        loggingUtils.log_error("Corrupted Zip File")
        return {"message": "Corrupted Zip File"}, 400


def post_task_queue_service(catalog_entry_upload):
    post_url = f"{UPLOAD_QUEUE_SERVICE_URL}/upload/enqueue/{catalog_entry_upload.id}"
    try:
        headers = {
            "Content-type": "application/json",
            "API-Key": UPLOAD_QUEUE_SERVICE_API_KEY,
        }
        response = requests.post(post_url, headers=headers)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        loggingUtils.log_upload_queue_error(catalog_entry_upload, f"{e}")


def log_upload(catalog_entry_upload):
    upload_message = (
        f"uploaded entry: catalog_entry_upload_id: {catalog_entry_upload.id}"
    )
    loggingUtils.standard_log(LOGGING_AREA, upload_message)
