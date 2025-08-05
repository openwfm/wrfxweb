from workerQueue.logging import utils as loggingUtils
from workerQueue.serviceKeys import (
    WORKER_URL,
)
from workerQueue.services.worker_services import WorkerServices

UPLOAD_ACTION = "UPLOAD"


class UploadServiceVarsError(Exception):
    def __init__(self, message):
        super().__init__(message)


class UploadWorkerServices(WorkerServices):
    def parse_service_vars(self, queue_line):
        line_vars = queue_line.split(" ")
        action = line_vars[0]
        if action != UPLOAD_ACTION:
            raise UploadServiceVarsError("UploadService only accepts UPLOAD actions")
        catalog_entry_upload_id = line_vars[1]
        return {"action": action, "catalog_entry_upload_id": catalog_entry_upload_id}

    def post_url(self, service_vars):
        catalog_entry_upload_id = service_vars["catalog_entry_upload_id"]
        return f"{WORKER_URL}/{catalog_entry_upload_id}"

    def log_post(self, service_vars):
        catalog_entry_upload_id = service_vars["catalog_entry_upload_id"]
        loggingUtils.log_upload_worker(catalog_entry_upload_id)

    def log_post_error(self, e):
        loggingUtils.log_upload_worker_error(e)


upload_worker_services = UploadWorkerServices()
