from worker.app import app
from api.services import (
    CatalogEntryServices as CatalogEntryServices,
)
from worker.workerKeys import UPLOAD_WORKER_API_KEY

from worker.actions.baseAction import BaseAction


class KMLAction(BaseAction):
    def __init__(self):
        super()
        self.LOGGING_AREA = "KMLAction"

    def validate_json(self, json):
        try:
            steps = json["steps"]
            mode = json["mode"]
            only_vars = json["only_vars"]
            catalog_entry_id = json["catalog_entry_id"]
            kmz_params = {
                "steps": steps,
                "mode": mode,
                "only_vars": only_vars,
                "catalog_entry_id": catalog_entry_id,
            }
            return kmz_params
        except:
            self.raise_validation_error("invalid_kml_json")

    def process(self, json):
        kml_json = self.validate_json(json)
        catalog_entry_id = kml_json["catalog_entry_id"]
        steps = kml_json["steps"]
        mode = kml_json["mode"]
        only_vars = kml_json["only_vars"]
        kml_message = f"KML catalog_entry_id: {catalog_entry_id} steps: {steps} mode: {mode} only_vars: {only_vars}"
        self.log_action(kml_message)
        with app.app_context():
            catalog_entry = CatalogEntryServices.find_by_id(catalog_entry_id)
            if catalog_entry == None:
                self.raise_action_error(f"No catalog_entry with id: {catalog_entry_id}")

            catalog_entry = CatalogEntryServices.kml_catalog_entry(
                catalog_entry.id, kml_json, UPLOAD_WORKER_API_KEY
            )
            if catalog_entry == None:
                self.raise_action_error(f"No catalog_entry with id: {catalog_entry_id}")
            self.log_action(f"KML Complete for catalog_entry_id: {catalog_entry_id}")


kml_action = KMLAction()
