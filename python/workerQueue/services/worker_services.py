from workerQueue.serviceKeys import (
    WORKER_URL,
    UPLOAD_WORKER_API_KEY,
)
from workerQueue.logging import utils as loggingUtils

import requests

POST_WORKER_START_URL = f"{WORKER_URL}/start"
GET_WORKER_READY_URL = f"{WORKER_URL}/ready"

WORKER_REQUEST_HEADERS = {
    "Content-type": "application/json",
    "API-Key": UPLOAD_WORKER_API_KEY,
}

LOGGING_AREA = "WorkerServices"


def worker_ready():
    try:
        response = requests.get(GET_WORKER_READY_URL, headers=WORKER_REQUEST_HEADERS)
        response.raise_for_status()
        return response.status_code == 200
    except:
        return False


def post_worker_start():
    try:
        if worker_ready():
            response = requests.post(
                POST_WORKER_START_URL,
                headers=WORKER_REQUEST_HEADERS,
            )
            response.raise_for_status()
            log_worker_services("Posted Worker Start")
        else:
            log_worker_services("Worker busy")
    except Exception as e:
        log_worker_services_error(e)


def log_worker_services(message):
    loggingUtils.standard_log("WorkerServices", message)


def log_worker_services_error(message):
    loggingUtils.error_log("WorkerServices", message)
