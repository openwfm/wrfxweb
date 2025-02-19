from uploadWorker.app import app
from uploadWorker.logging import utils as loggingUtils
import uploadWorker.utils as utils
from uploadWorker.workerKeys import (
    UPLOAD_WORKER_API_KEY,
)
from functools import wraps
import threading
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
    catalog_entry_upload = utils.validate_catalog_entry_upload(catalog_entry_upload_id)
    loggingUtils.log_upload_worker_post(catalog_entry_upload_id)
    thread = threading.Thread(
        target=utils.process_catalog_entry_upload, args=[catalog_entry_upload]
    )
    thread.start()

    return {"message": "Success!"}, 200
