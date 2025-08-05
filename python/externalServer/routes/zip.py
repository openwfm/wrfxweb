from externalServer.app import app
from externalServer.utils import api_key_required
from externalServer.logging import utils as loggingUtils

from externalServer.serverKeys import (
    UPLOAD_QUEUE_SERVICE_URL,
    UPLOAD_QUEUE_SERVICE_API_KEY,
)

from api.services import (
    CatalogEntryServices as CatalogEntryServices,
)

from flask import request
import requests


@app.route("/entries/<catalog_entry_id>/zip", methods=["POST"])
@api_key_required
def zip_catalog_entry(catalog_entry_id):
    if request.method == "POST":
        zip_posted = post_zip_catalog_entry(catalog_entry_id)
        if zip_posted:
            return {"message": "Catalog Entry successfully staged for Zipping"}, 200
        return {"message": "Catalog Entry unsuccessfully staged for Zipping"}, 500

    return {
        "message": "Method Not Allowed",
    }, 405


@app.route("/jobs/<job_id>/zip", methods=["POST"])
@api_key_required
def zip_job_id(job_id):
    if request.method == "POST":
        catalog_entry = CatalogEntryServices.find_by_job_id(job_id)
        if catalog_entry == None:
            return {"message": "No CatalogEntry with job id"}, 500
        zip_posted = post_zip_catalog_entry(catalog_entry.id)
        if zip_posted:
            return {"message": "Catalog Entry successfully staged for Zipping"}, 200
        return {"message": "Catalog Entry unsuccessfully staged for Zipping"}, 500

    return {
        "message": "Method Not Allowed",
    }, 405


def post_zip_catalog_entry(catalog_entry_id):
    post_url = f"{UPLOAD_QUEUE_SERVICE_URL}/zip/enqueue/{catalog_entry_id}"
    try:
        headers = {
            "Content-type": "application/json",
            "API-Key": UPLOAD_QUEUE_SERVICE_API_KEY,
        }
        response = requests.post(post_url, headers=headers)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        loggingUtils.log_zip_queue_error(catalog_entry_id, f"{e}")
        return False
