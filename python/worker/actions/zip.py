from worker.app import app
from api.services import (
    CatalogEntryServices as CatalogEntryServices,
)
from worker.workerKeys import UPLOAD_WORKER_API_KEY

from worker.actions.baseAction import BaseAction


class ZipAction(BaseAction):
    def __init__(self):
        super()
        self.LOGGING_AREA = "ZipAction"

    def validate_json(self, json):
        try:
            catalog_entry_id = json["catalog_entry_id"]
            return {"catalog_entry_upload_id": catalog_entry_id}
        except:
            self.raise_validation_error("Invalid catalog_entry_upload_id")

    def process(self, json):
        zip_json = self.validate_json(json)
        catalog_entry_id = zip_json["catalog_entry_id"]
        self.log_action(f"ZIP catalog_entry_id: {catalog_entry_id}")
        with app.app_context():
            catalog_entry = CatalogEntryServices.find_by_id(catalog_entry_id)
            if catalog_entry == None:
                self.raise_action_error(f"No catalog_entry with id: {catalog_entry_id}")

            catalog_entry = CatalogEntryServices.zip_catalog_entry(
                catalog_entry_id, UPLOAD_WORKER_API_KEY
            )
            if catalog_entry == None:
                self.raise_action_error(f"No catalog_entry with id: {catalog_entry_id}")
            self.log_action(f"ZIP Complete catalog_entry_id: {catalog_entry_id}")


zip_action = ZipAction()
