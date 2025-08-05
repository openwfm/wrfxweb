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

KMZ_INC = "inc"
KMZ_REF = "ref"


@app.route("/entries/<catalog_entry_id>/kml", methods=["POST"])
@api_key_required
def kml_catalog_entry(catalog_entry_id):
    if request.method == "POST":
        zip_posted = post_kml_catalog_entry(catalog_entry_id)
        if zip_posted:
            return {"message": "Catalog Entry successfully staged for Zipping"}, 200
        return {"message": "Catalog Entry unsuccessfully staged for Zipping"}, 500

    return {
        "message": "Method Not Allowed",
    }, 405


@app.route("/jobs/<job_id>/kml", methods=["POST"])
@api_key_required
def kml_job_id(job_id):
    if request.method == "POST":
        catalog_entry = CatalogEntryServices.find_by_job_id(job_id)
        if catalog_entry == None:
            return {"message": "No CatalogEntry with job id"}, 500
        zip_posted = post_kml_catalog_entry(catalog_entry)
        if zip_posted:
            return {"message": "Catalog Entry successfully staged for Kml"}, 200
        return {"message": "Catalog Entry unsuccessfully staged for Kml"}, 500

    return {
        "message": "Method Not Allowed",
    }, 405


def post_kml_catalog_entry(catalog_entry):
    try:
        catalog_entry_id = catalog_entry.id
        kml_params = request_kml_params(catalog_entry)
        post_url = f"{UPLOAD_QUEUE_SERVICE_URL}/enqueue/{catalog_entry_id}/kml"
        headers = {
            "Content-type": "application/json",
            "API-Key": UPLOAD_QUEUE_SERVICE_API_KEY,
        }
        response = requests.post(post_url, headers=headers, json=kml_params)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        loggingUtils.log_kml_queue_error(catalog_entry.id, f"{e}")
        return False


def request_kml_params(catalog_entry):
    steps = verify_steps(request.form["steps"])
    mode = verify_mode(request.form["mode"])
    only_vars = verify_only_vars(request.form["only_vars"], catalog_entry)
    return {
        "steps": steps,
        "mode": mode,
        "only_vars": only_vars,
    }


class KMLParamError(Exception):
    def __init__(self, message):
        super().__init__(message)


def verify_steps(steps):
    if steps == None:
        return steps
    for step in steps.split(","):
        if not step.isdigit():
            raise KMLParamError("Steps must be a list of digits")
    return steps


def verify_mode(mode):
    if mode == None:
        return "inc"
    if mode != KMZ_INC or mode != KMZ_REF:
        raise KMLParamError(f"Mode must be {KMZ_INC} or {KMZ_REF}")
    return mode


def verify_only_vars(only_vars, catalog_entry):
    if only_vars == None:
        return only_vars
    entry_vars = set(catalog_entry.sim_vars())
    for only_var in only_vars.split(","):
        if only_var not in entry_vars:
            raise KMLParamError("only_vars must be a valid simulation variable")
    return only_vars
