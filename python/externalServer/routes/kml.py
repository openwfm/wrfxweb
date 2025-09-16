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

from flask import request
import requests

KMZ_INC = "inc"
KMZ_REF = "ref"


@app.route("/entries/<catalog_entry_id>/kml", methods=["POST"])
@universal_api_key_required
def kml_catalog_entry(catalog_entry_id):
    if request.method == "POST":
        try:
            kml_posted = post_kml_catalog_entry(catalog_entry_id)
            if kml_posted:
                return {"message": "Catalog Entry successfully staged for Kml"}, 200
            return {"message": "Catalog Entry unsuccessfully staged for Kml"}, 500
        except:
            return {"message": "Catalog Entry unsuccessfully staged for Kml"}, 500
    return {
        "message": "Method Not Allowed",
    }, 405


@app.route("/jobs/<job_id>/kml", methods=["POST"])
@universal_api_key_required
def kml_job_id(job_id):
    if request.method == "POST":
        catalog_entry = CatalogEntryServices.find_by_job_id(job_id)
        if catalog_entry == None:
            return {"message": "No CatalogEntry with job id"}, 500
        kml_posted = post_kml_catalog_entry(catalog_entry)
        if kml_posted:
            return {"message": "Catalog Entry successfully staged for Kml"}, 200
        return {"message": "Catalog Entry unsuccessfully staged for Kml"}, 500

    return {
        "message": "Method Not Allowed",
    }, 405


def post_kml_catalog_entry(catalog_entry_id):
    try:
        catalog_entry = CatalogEntryServices.find_by_id(catalog_entry_id)
        if catalog_entry == None:
            return False
        catalog_entry_id = catalog_entry.id
        kml_params = request_kml_params(catalog_entry)
        post_url = f"{UPLOAD_QUEUE_SERVICE_URL}/kml/enqueue/{catalog_entry_id}"
        headers = {
            "Content-type": "application/json",
            "API-Key": UPLOAD_QUEUE_SERVICE_API_KEY,
        }
        response = requests.post(post_url, headers=headers, json=kml_params)
        response.raise_for_status()
        return True
    except Exception as e:
        loggingUtils.log_kml_queue_error(catalog_entry_id, f"{e}")
        return False


def request_kml_params(catalog_entry):
    steps = None
    if "steps" in request.form:
        steps = request.form["steps"]
    mode = None
    if "mode" in request.form:
        mode = request.form["mode"]
    only_vars = None
    if "only_vars" in request.form:
        only_vars = request.form["only_vars"]
    return {
        "steps": CatalogEntryServices.verify_steps(steps),
        "mode": CatalogEntryServices.verify_mode(mode),
        "only_vars": CatalogEntryServices.verify_only_vars(only_vars, catalog_entry),
    }
