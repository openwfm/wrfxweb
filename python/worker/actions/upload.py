from worker.app import app
from api.services import (
    CatalogEntryUploadServices as CatalogEntryUploadServices,
    CatalogEntryServices as CatalogEntryServices,
)
from worker.workerKeys import UPLOAD_WORKER_API_KEY

from worker.actions.baseAction import BaseAction


class UploadAction(BaseAction):
    def __init__(self):
        super()
        self.LOGGING_AREA = "UploadAction"

    def validate_json(self, json):
        try:
            catalog_entry_upload_id = json["catalog_entry_upload_id"]
            return {"catalog_entry_upload_id": catalog_entry_upload_id}
        except:
            self.raise_validation_error("Invalid catalog_entry_upload_id")

    def process(self, json):
        upload_json = self.validate_json(json)
        catalog_entry_upload_id = upload_json["catalog_entry_upload_id"]
        upload_message = f"UPLOAD catalog_entry_upload_id: {catalog_entry_upload_id}"
        self.log_action(upload_message)
        with app.app_context():
            catalog_entry_upload = CatalogEntryUploadServices.find_by_id(
                catalog_entry_upload_id
            )

            if catalog_entry_upload == None:
                no_catalog_entry = f"catalog_entry_upload_id: {catalog_entry_upload_id}"
                self.raise_action_error(no_catalog_entry)

            upload_message = (
                f"Processing catalog_entry_upload_id: {catalog_entry_upload_id}"
            )
            self.log_action(upload_message)
            catalog_entry = CatalogEntryUploadServices.unpack_by_id(
                catalog_entry_upload.id, UPLOAD_WORKER_API_KEY
            )
            upload_message = (
                f"Processed catalog_entry_upload_id: {catalog_entry_upload_id}"
            )
            self.log_action(upload_message)

            if catalog_entry == None:
                return

            upload_message = f"Processing catalog_entry pngs: {catalog_entry.id}"
            self.log_action(upload_message)
            CatalogEntryServices.process_pngs(catalog_entry.id, UPLOAD_WORKER_API_KEY)
            upload_message = f"Creating catalog_entry manifest: {catalog_entry.id}"
            self.log_action(upload_message)
            CatalogEntryServices.recreate_manifest(
                catalog_entry.id, UPLOAD_WORKER_API_KEY
            )
            CatalogEntryUploadServices.update_catalog_entry_catalogs(
                catalog_entry.id, catalog_entry_upload.id, UPLOAD_WORKER_API_KEY
            )
        upload_message = (
            f"UPLOAD COMPLETE catalog_entry_upload_id: {catalog_entry_upload_id}"
        )
        self.log_action(upload_message)


upload_action = UploadAction()
