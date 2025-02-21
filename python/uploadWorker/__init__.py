from uploadWorker.app import app
from uploadWorker.logging import utils as loggingUtils
from uploadWorker.services.upload_thread import upload_thread
from uploadWorker.workerKeys import (
    UPLOAD_WORKER_API_KEY,
)
from api.services import CatalogEntryUploadServices as CatalogEntryUploadServices

from functools import wraps
from flask import request


def api_key_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        api_key = request.headers.get("API-Key")
        if api_key == None:
            return {"message": "Missing API key"}, 401
        if api_key == UPLOAD_WORKER_API_KEY:
            return f(*args, **kwargs)
        return {"message": "Invalid API key"}, 401

    return wrapper


# when an enque, check if busy, if busy, add to queue. if not busy, post to worker, set to busy.
@app.route("/<catalog_entry_upload_id>", methods=["POST"])
@api_key_required
def post_upload(catalog_entry_upload_id):
    loggingUtils.log_upload_worker_post(catalog_entry_upload_id)
    if not catalog_entry_upload_id.isdigit():
        return {"message": "catalog_entry_upload_id must be an integer"}, 401

    upload_thread.start(int(catalog_entry_upload_id))

    return {"message": "Success!"}, 200


# when an enque, check if busy, if busy, add to queue. if not busy, post to worker, set to busy.
@app.route("/ready", methods=["GET"])
@api_key_required
def service_ready():
    if upload_thread.ready():
        return {"message": "Service is ready!"}, 200
    return {"message": "Service is busy"}, 503
