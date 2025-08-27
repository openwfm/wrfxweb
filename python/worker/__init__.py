from worker.app import app
from worker.logging import utils as loggingUtils
from worker.threads.action_thread import action_thread
from worker.workerKeys import (
    UPLOAD_WORKER_API_KEY,
)
from api.services import CatalogEntryUploadServices as CatalogEntryUploadServices

from functools import wraps
from flask import request

LOGGING_AREA = "WORKER API"


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
@app.route("/ready", methods=["GET"])
@api_key_required
def service_ready():
    if action_thread.ready():
        return {"message": "Service is ready!"}, 200
    return {"message": "Service is busy"}, 503


# when an enque, check if busy, if busy, add to queue. if not busy, post to worker, set to busy.
@app.route("/start", methods=["GET"])
@api_key_required
def service_start():
    if not action_thread.ready():
        log_worker_busy()
        return {"message": "Service is busy!"}, 204
    log_worker_start()
    action_thread.start()
    return {"message": "Success"}, 200


def log_worker_busy():
    message = "Worker is busy"
    loggingUtils.standard_log(LOGGING_AREA, message)


def log_worker_start():
    message = "Worker started"
    loggingUtils.standard_log(LOGGING_AREA, message)
