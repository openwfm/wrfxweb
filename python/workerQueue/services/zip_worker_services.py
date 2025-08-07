from workerQueue.logging import utils as loggingUtils
from workerQueue.serviceKeys import (
    WORKER_URL,
)
from workerQueue.services.worker_services import WorkerServices


from workerQueue.services.constants import ZIP_ACTION


class ZipServiceVarsError(Exception):
    def __init__(self, message):
        super().__init__(message)


class ZipWorkerServices(WorkerServices):
    def parse_service_vars(self, queue_line):
        line_vars = queue_line.split(" ")
        action = line_vars[0]
        if action != ZIP_ACTION:
            raise ZipServiceVarsError("ZipWorkerService only accepts ZIP actions")
        catalog_entry_id = line_vars[1]
        return {"action": action, "catalog_entry_id": catalog_entry_id}

    def post_url(self, service_vars):
        catalog_entry_id = service_vars["catalog_entry_id"]
        return f"{WORKER_URL}/zip/{catalog_entry_id}"

    def log_post(self, service_vars):
        catalog_entry_upload_id = service_vars["catalog_entry_upload_id"]
        loggingUtils.log_zip_worker(catalog_entry_upload_id)

    def log_post_error(self, e):
        loggingUtils.log_zip_worker_error(e)


zip_worker_services = ZipWorkerServices()
