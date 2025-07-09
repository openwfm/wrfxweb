from clientServer.app import app

from clientServer.routes.admin.admin_utils import admin_login_required
from clientServer.logging import utils as loggingUtils
from clientServer.serverKeys import (
    UPLOAD_QUEUE_SERVICE_URL,
    UPLOAD_QUEUE_SERVICE_API_KEY,
    ADMIN_SERVICES_API_KEY,
)
from clientServer.threads.catalogEntryDeleteThread import (
    catalog_entry_delete_queue,
    catalog_entry_delete_thread,
)

from api.services import (
    CatalogEntryUploadServices as CatalogEntryUploadServices,
    CatalogEntryServices as CatalogEntryServices,
    CatalogEntryCatalogServices as CatalogEntryCatalogServices,
    UploadToCatalogServices as UploadToCatalogServices,
    CatalogServices as CatalogServices,
)
from api.serializers import CatalogEntrySerializer as CatalogEntrySerializer

from flask import request
from flask_login import current_user
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


@app.route(
    "/admin/catalogs/<catalog_id>/entries/<catalog_entry_id>",
    methods=["POST", "DELETE"],
)
@admin_login_required
def add_catalog_entry_to_catalog(catalog_id, catalog_entry_id):
    if request.method == "POST":
        return create_catalog_entry_catalog(catalog_id, catalog_entry_id)
    elif request.method == "DELETE":
        return delete_catalog_entry_catalog(catalog_id, catalog_entry_id)
    return {
        "message": "Method Not Allowed",
    }, 405


def create_catalog_entry_catalog(catalog_id, catalog_entry_id):
    try:
        catalog_entry_catalog_params = {
            "catalog_id": catalog_id,
            "catalog_entry_id": catalog_entry_id,
        }
        catalog_entry_catalog = CatalogEntryCatalogServices.find_or_create(
            catalog_entry_catalog_params, ADMIN_SERVICES_API_KEY
        )

        if catalog_entry_catalog == None:
            return {
                "message": "An error occurred while adding catalog entry to catalog"
            }, 400

    except Exception as e:
        loggingUtils.log_error(e)
        return {
            "message": "An error occurred while adding catalog entry to catalog"
        }, 400

    loggingUtils.log_catalog_entry_catalog_create(
        catalog_entry_catalog, current_user.id
    )
    return {
        "message": "Entry Successfully Added To Catalog!",
    }, 200


def delete_catalog_entry_catalog(catalog_id, catalog_entry_id):
    try:
        catalog_entry_catalog_params = {
            "catalog_id": catalog_id,
            "catalog_entry_id": catalog_entry_id,
        }
        catalog_entry_catalog_deleted = CatalogEntryCatalogServices.delete(
            catalog_entry_catalog_params, ADMIN_SERVICES_API_KEY
        )
        if not catalog_entry_catalog_deleted:
            return {
                "message": "An error occurred while deleting catalog entry from catalog"
            }, 400
    except Exception as e:
        loggingUtils.log_error(e)
        return {
            "message": "An error occurred while deleting catalog entry from catalog"
        }, 400

    loggingUtils.log_catalog_entry_catalog_delete(
        catalog_id, catalog_entry_id, current_user.id
    )
    return {
        "message": "Entry Successfully Deleted From Catalog!",
    }, 200


@app.route("/admin/catalog_entries/all", methods=["GET"])
@admin_login_required
def all_catalog_entries():
    if request.method == "GET":
        return get_all_catalog_entries()
    return {
        "message": "Method Not Allowed",
    }, 405


def get_all_catalog_entries():
    catalog_entries = CatalogEntryServices.admin_all_entries(
        current_user, ADMIN_SERVICES_API_KEY
    )
    return {
        "entries": CatalogEntrySerializer.serialize_catalog_entries_with_catalogs(
            catalog_entries, current_user, ADMIN_SERVICES_API_KEY
        )
    }, 200


@app.route("/admin/catalog_entries/<catalog_entry_id>", methods=["DELETE"])
@admin_login_required
def catalog_entry(catalog_entry_id):
    if request.method == "DELETE":
        return delete_catalog_entry(catalog_entry_id)
    return {
        "message": "Method Not Allowed",
    }, 405


def delete_catalog_entry(catalog_entry_id):
    entry_marked_for_deletion = CatalogEntryServices.mark_id_for_deletion(
        catalog_entry_id, current_user, ADMIN_SERVICES_API_KEY
    )
    # catalog_entry_delete_queue.put(catalog_entry_id)
    # if catalog_entry_delete_thread.ready():
    #     catalog_entry_delete_thread.start()
    # entry_deleted = CatalogEntryServices.delete_by_id(
    #     catalog_entry_id, current_user, ADMIN_SERVICES_API_KEY
    # )

    if entry_marked_for_deletion:
        return {
            "message": "CatalogEntry successfully deleted!",
        }, 200
    return {"message": "An error occurred while deleted CatalogEntry"}, 400


def get_catalog_entries(catalog_id):
    catalog_entries = CatalogEntryServices.admin_entries(
        catalog_id, current_user, ADMIN_SERVICES_API_KEY
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
            "uploader_id": current_user.id,
        }
        catalog_entry_upload = CatalogEntryUploadServices.create(
            catalog_entry_params, ADMIN_SERVICES_API_KEY
        )
        if catalog_entry_upload == None:
            return {"message": "An error occurred while uploading file"}, 400

        verify_zip_upload(catalog_entry_upload)

        upload_to_catalog_params = {
            "catalog_entry_upload_id": catalog_entry_upload.id,
            "catalog_id": catalog_id,
        }
        UploadToCatalogServices.find_or_create(
            upload_to_catalog_params, ADMIN_SERVICES_API_KEY
        )
    except Exception as e:
        loggingUtils.log_error(e)
        return {"message": "An error occurred while uploading file"}, 400

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


class ZipVerificationException(Exception):
    def __init__(self, message):
        super().__init__(message)


def verify_zip_upload(catalog_entry_upload):
    upload_path = catalog_entry_upload.upload_path()
    try:
        with zipfile.ZipFile(upload_path) as zip_ref:
            zip_ref.testzip()
    except zipfile.BadZipFile:
        os.remove(upload_path)
        catalog_entry_upload.destroy()
        raise ZipVerificationException("Corrupted Zip File")
