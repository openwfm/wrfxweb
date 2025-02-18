from uploadQueueService.app import app
from uploadQueueService import services
from uploadQueueService.logging import utils as loggingUtils
from uploadQueueService.serviceKeys import (
    UPLOAD_QUEUE_SERVICE_API_KEY,
    SIMULATION_WORKER_URL,
    SIMULATION_WORKER_API_KEY,
)
from functools import wraps
from flask import request
import requests


def api_key_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        api_key = request.headers.get("API-Key")
        if api_key == None:
            return {"message": "Missing API key"}, 401
        if api_key == UPLOAD_QUEUE_SERVICE_API_KEY:
            return f(*args, **kwargs)
        return {"message": "Invalid API key"}, 401

    return wrapper


waiting_on_worker = False


# when an enque, check if busy, if busy, add to queue. if not busy, post to worker, set to busy.
@app.route("/enqueue/<catalog_entry_upload_id>", methods=["POST"])
@api_key_required
def equeue_upload(catalog_entry_upload_id):
    enqueue(catalog_entry_upload_id)
    if not waiting_on_worker:
        post_upload_worker(catalog_entry_upload_id)
    return {"message": "Success!"}, 200


# called after worker done with last upload. if queue empty, set busy to false. else, pop queue and respond
# with next upload task
@app.route("/dequeue", methods=["GET"])
@api_key_required
def dequeue_upload():
    dequeue()
    next_catalog_entry_upload_id = peek()
    if next_catalog_entry_upload_id == None:
        return {"message": "Queue is Empty!"}, 204
    else:
        return {"catalog_entry_upload_id": next_catalog_entry_upload_id}


def enqueue(catalog_entry_upload_id):
    loggingUtils.log_enqueue(catalog_entry_upload_id)
    pass


def dequeue():
    catalog_entry_upload_id = ""
    loggingUtils.log_dequeue(catalog_entry_upload_id)
    return ""


def peek():
    return ""


def post_upload_worker(catalog_entry_upload_id):
    post_url = f"{SIMULATION_WORKER_URL}/{catalog_entry_upload_id}"
    try:
        headers = {
            "Content-type": "application/json",
            "API-Key": SIMULATION_WORKER_API_KEY,
        }
        response = requests.post(post_url, headers=headers)
        response.raise_for_status()
        loggingUtils.log_upload_worker(catalog_entry_upload_id)
    except requests.exceptions.RequestException as e:
        loggingUtils.log_upload_worker_error(catalog_entry_upload_id, f"{e}")
