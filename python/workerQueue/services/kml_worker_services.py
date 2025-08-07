from workerQueue.logging import utils as loggingUtils
from workerQueue.serviceKeys import (
    WORKER_URL,
)
from workerQueue.services.worker_services import WorkerServices

from workerQueue.services.constants import KML_ACTION


class KmlServiceVarsError(Exception):
    def __init__(self, message):
        super().__init__(message)


class KmlWorkerServices(WorkerServices):
    def parse_service_vars(self, queue_line):
        line_vars = queue_line.split(" ")
        action = line_vars[0]
        if action != KML_ACTION:
            raise KmlServiceVarsError(
                f"KmlWorkerServices only accept {KML_ACTION} actions"
            )
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

    def post_url(self, service_vars):
        catalog_entry_id = service_vars["catalog_entry_id"]
        return f"{WORKER_URL}/kml/{catalog_entry_id}"

    def json_body(self, service_vars):
        return {
            "steps": service_vars["steps"],
            "mode": service_vars["mode"],
            "only_vars": service_vars["only_vars"],
        }

    def log_post(self, service_vars):
        catalog_entry_id = service_vars["catalog_entry_id"]
        loggingUtils.log_kml_worker(catalog_entry_id)

    def log_post_error(self, e):
        loggingUtils.log_kml_worker_error(e)


kml_worker_services = KmlWorkerServices()
