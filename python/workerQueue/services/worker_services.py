from workerQueue.serviceKeys import (
    WORKER_URL,
    UPLOAD_WORKER_API_KEY,
)
from workerQueue.logging import utils as loggingUtils

from workerQueue.services.constants import UPLOAD_ACTION, KML_ACTION, ZIP_ACTION
import requests

POST_WORKER_START_URL = f"{WORKER_URL}/start"
GET_WORKER_READY_URL = f"{WORKER_URL}/ready"

WORKER_REQUEST_HEADERS = {
    "Content-type": "application/json",
    "API-Key": UPLOAD_WORKER_API_KEY,
}


def worker_ready():
    response = requests.get(GET_WORKER_READY_URL, headers=WORKER_REQUEST_HEADERS)
    response.raise_for_status()
    return response.status_code == 200


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
    loggingUtils.log_statement("WorkerServices", message, True)


def log_worker_services_error(message):
    loggingUtils.log_statement("WorkerServicesError", message, True)


def parse_queue_line(queue_line):
    line_vars = queue_line.split(" ")
    action = line_vars[0]
    if action not in ACTION_PARSERS:
        log_action_parsing_error(queue_line, f"Unsuported action: {action}")
        return None
    action_parser = ACTION_PARSERS[action]
    try:
        return action_parser(line_vars)
    except Exception as e:
        log_action_parsing_error(queue_line, e)
        return None


def log_action_parsing_error(queue_line, error):
    error_message = f"{error} : {queue_line}"
    loggingUtils.log_statement("WorkerServices [Parsing ERROR]", error_message, True)


class ServiceVarsError(Exception):
    def __init__(self, message):
        super().__init__(message)


def parse_upload_service_vars(line_vars):
    action = line_vars[0]
    if action != UPLOAD_ACTION:
        raise ServiceVarsError("UploadService only accepts UPLOAD actions")
    catalog_entry_upload_id = line_vars[1]
    return {"action": action, "catalog_entry_upload_id": catalog_entry_upload_id}


def parse_kml_service_vars(line_vars):
    action = line_vars[0]
    if action != KML_ACTION:
        raise ServiceVarsError(f"KmlWorkerServices only accept {KML_ACTION} actions")
    catalog_entry_id = line_vars[1]
    steps = line_vars[2]
    mode = line_vars[3]
    only_vars = line_vars[4]
    return {
        "action": action,
        "catalog_entry_id": catalog_entry_id,
        "steps": steps,
        "mode": mode,
        "only_vars": only_vars,
    }


def parse_zip_service_vars(line_vars):
    action = line_vars[0]
    if action != ZIP_ACTION:
        raise ServiceVarsError("ZipWorkerService only accepts ZIP actions")
    catalog_entry_id = line_vars[1]
    return {"action": action, "catalog_entry_id": catalog_entry_id}


ACTION_PARSERS = {
    UPLOAD_ACTION: parse_upload_service_vars,
    KML_ACTION: parse_kml_service_vars,
    ZIP_ACTION: parse_zip_service_vars,
}
