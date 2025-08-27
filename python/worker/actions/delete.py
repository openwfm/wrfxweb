from worker.app import app
from api.services import (
    CatalogEntryServices as CatalogEntryServices,
)
from worker.workerKeys import UPLOAD_WORKER_API_KEY

from worker.actions.baseAction import BaseAction


class DeleteAction(BaseAction):
    def __init__(self):
        super()
        self.LOGGING_AREA = "DeleteAction"

    def validate_json(self, json):
        try:
            catalog_entry_id = json["catalog_entry_id"]
            return {
                "catalog_entry_id": catalog_entry_id,
            }
        except:
            self.raise_validation_error("Invalid delete_json")

    def process(self, json):
        delete_json = self.validate_json(json)
        catalog_entry_id = delete_json["catalog_entry_id"]
        delete_message = f"DELETE catalog_entry_id: {catalog_entry_id}"
        self.log_action(delete_message)

        with app.app_context():
            CatalogEntryServices.delete_by_id(catalog_entry_id, UPLOAD_WORKER_API_KEY)
        delete_message = f"DELETE COMPLETE catalog_entry_id: {catalog_entry_id}"
        self.log_action(delete_message)


delete_action = DeleteAction()
