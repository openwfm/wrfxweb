import workerQueue.logging.utils as loggingUtils
from workerQueue.serviceKeys import SIMULATIONS_FOLDER
from api.services import (
    CatalogEntryUploadServices as CatalogEntryUploadServices,
    CatalogEntryServices as CatalogEntryServices,
    CatalogServices as CatalogServices,
)

import os


class ActionError(Exception):
    def __init__(self):
        message = "Error processing Action"
        super().__init__(message)


class BaseAction:
    def __init__(self):
        self.LOGGING_AREA = "BaseAction"

    def parse_queue_line(self, queue_line):
        return {}

    def compose_queue_line(self, action_json):
        return f"{action_json}"

    def validate_action_json(self, action_json):
        return {}

    def raise_invalid_action_json(self, action_json):
        message = f"invalid action_json: {action_json}"
        loggingUtils.error_log(self.LOGGING_AREA, message)
        raise ActionError()

    def raise_invalid_queue_line(self, queue_line):
        message = f"invalid queue_line: {queue_line}"
        loggingUtils.error_log(self.LOGGING_AREA, message)
        raise ActionError()

    def validate_catalog_id(self, catalog_id):
        if not str(catalog_id).isdigit():
            return False
        catalog = CatalogServices.find_by_id(catalog_id)
        if catalog == None:
            return False
        return True

    def validate_job_id(self, job_id):
        full_job_path = os.path.join(SIMULATIONS_FOLDER, job_id)
        if not os.path.exists(full_job_path):
            return False
        return True

    def validate_catalog_entry_id(self, catalog_entry_id):
        if not catalog_entry_id.isdigit():
            return False
        catalog_entry = CatalogEntryServices.find_by_id(catalog_entry_id)
        if catalog_entry == None:
            return False
        return True

    def validate_catalog_entry_upload_id(self, catalog_entry_upload_id):
        if not catalog_entry_upload_id.isdigit():
            return False
        catalog_entry_upload = CatalogEntryUploadServices.find_by_id(
            catalog_entry_upload_id
        )
        if catalog_entry_upload == None:
            return False
        return True
