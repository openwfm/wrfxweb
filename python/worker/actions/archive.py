from worker.app import app
from api.services import (
    CatalogEntryServices as CatalogEntryServices,
)
from worker.workerKeys import UPLOAD_WORKER_API_KEY

from worker.actions.baseAction import BaseAction


class ArchiveAction(BaseAction):
    def __init__(self):
        super()
        self.LOGGING_AREA = "ArchiveAction"

    def validate_json(self, json):
        try:
            catalog_entry_id = json["catalog_entry_id"]
            number_of_days = json["number_of_days"]
            return {
                "catalog_entry_id": catalog_entry_id,
                "number_of_days": number_of_days,
            }
        except:
            self.raise_validation_error("Invalid archive_json")

    def process(self, json):
        archive_json = self.validate_json(json)
        catalog_entry_id = archive_json["catalog_entry_id"]
        number_of_days = archive_json["number_of_days"]
        archive_message = f"ARCHIVE catalog_entry_id: {catalog_entry_id} number_of_days: {number_of_days}"
        self.log_action(archive_message)
        with app.app_context():
            CatalogEntryServices.delete_stale_timestamps(
                catalog_entry_id, number_of_days, UPLOAD_WORKER_API_KEY
            )
            CatalogEntryServices.recreate_manifest(
                catalog_entry_id, UPLOAD_WORKER_API_KEY
            )
            CatalogEntryServices.zip_catalog_entry(
                catalog_entry_id, UPLOAD_WORKER_API_KEY
            )
            CatalogEntryServices.kml_catalog_entry(
                catalog_entry_id, {}, UPLOAD_WORKER_API_KEY
            )
        archive_message = f"ARCHIVE COMPLETE catalog_entry_id: {catalog_entry_id} number_of_days: {number_of_days}"
        self.log_action(archive_message)


archive_action = ArchiveAction()
