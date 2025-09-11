from externalServer.app import app
from externalServer.utils import universal_api_key_required
from externalServer.logging import utils as loggingUtils

from externalServer.serverKeys import (
    UPLOAD_QUEUE_SERVICE_URL,
    UPLOAD_QUEUE_SERVICE_API_KEY,
)

from api.services import (
    CatalogEntryServices as CatalogEntryServices,
)

from flask import abort, request
import requests

LOGGING_AREA = "ArchiveRoutes"


@app.route("/entries/<catalog_entry_id>/archive", methods=["POST"])
@universal_api_key_required
def archive_catalog_entry(catalog_entry_id):
    if request.method == "POST":
        archive_posted = post_archive_catalog_entry(catalog_entry_id)
        if archive_posted:
            return {"message": "Catalog Entry successfully staged for Archive"}, 200
        return {"message": "Catalog Entry unsuccessfully staged for Archive"}, 500

    return {
        "message": "Method Not Allowed",
    }, 405


@app.route("/jobs/<job_id>/archive", methods=["POST"])
@universal_api_key_required
def archive_job_id(job_id):
    if request.method == "POST":
        catalog_entry = CatalogEntryServices.find_by_job_id(job_id)
        if catalog_entry == None:
            return {"message": "No CatalogEntry with job id"}, 500
        archive_posted = post_archive_catalog_entry(catalog_entry)
        if archive_posted:
            return {"message": "Catalog Entry successfully staged for Archive"}, 200
        return {"message": "Catalog Entry unsuccessfully staged for Archive"}, 500

    return {
        "message": "Method Not Allowed",
    }, 405


def post_archive_catalog_entry(catalog_entry):
    try:
        catalog_entry_id = catalog_entry.id
        archive_params = request_archive_params()
        post_url = f"{UPLOAD_QUEUE_SERVICE_URL}/archive/enqueue/{catalog_entry_id}"
        headers = {
            "Content-type": "application/json",
            "API-Key": UPLOAD_QUEUE_SERVICE_API_KEY,
        }
        response = requests.post(post_url, headers=headers, json=archive_params)
        response.raise_for_status()
        return True
    except Exception as e:
        log_archive_error(catalog_entry.id, e)
        return False


def request_archive_params():
    try:
        number_of_days = request.form["number_of_days"]
        if not number_of_days.isdigit():
            abort(500, "Posted number_of_days must be digit")
        return {
            "number_of_days": number_of_days,
        }
    except:
        abort(500, "Posted number_of_days must include steps, mode, and only_vars")


def log_archive_error(catalog_entry_id, error):
    error_message = f"catalog_entry_id: {catalog_entry_id}, error: {error}"
    loggingUtils.error_log(LOGGING_AREA, error_message)
