from workerQueue.actions.baseAction import BaseAction
from api.services import CatalogEntryServices as CatalogEntryServices

KML_ACTION = "KML"


class KMLAction(BaseAction):
    def __init__(self):
        super()
        self.LOGGING_AREA = "KMLAction"

    def parse_queue_line(self, queue_line):
        line_vars = queue_line.split(" ")
        action = line_vars[0]
        catalog_entry_id = line_vars[1]
        steps = line_vars[2]
        if steps == "None":
            steps = None
        mode = line_vars[3]
        if mode == "None":
            mode = None
        only_vars = line_vars[4]
        if only_vars == "None":
            only_vars = None
        action_json = {
            "action": action,
            "catalog_entry_id": catalog_entry_id,
            "steps": steps,
            "mode": mode,
            "only_vars": only_vars,
        }
        return self.validate_action_json(action_json)

    def compose_queue_line(self, action_json):
        action_json = self.validate_action_json(action_json)
        catalog_entry_id = action_json["catalog_entry_id"]
        steps = action_json["steps"]
        mode = action_json["mode"]
        only_vars = action_json["only_vars"]
        queue_line = f"{KML_ACTION} {catalog_entry_id} {steps} {mode} {only_vars}"

        return queue_line

    def validate_action_json(self, action_json):
        try:
            if action_json["action"] != KML_ACTION:
                self.raise_invalid_action_json(action_json)
            catalog_entry_id = action_json["catalog_entry_id"]
            if not self.validate_catalog_entry_id(catalog_entry_id):
                self.raise_invalid_action_json(action_json)
            catalog_entry = CatalogEntryServices.find_by_id(catalog_entry_id)
            steps = CatalogEntryServices.verify_steps(action_json["steps"])
            if steps == "":
                steps = None
            mode = CatalogEntryServices.verify_mode(action_json["mode"])
            only_vars = CatalogEntryServices.verify_only_vars(
                action_json["only_vars"], catalog_entry
            )
            return {
                "action": KML_ACTION,
                "catalog_entry_id": catalog_entry_id,
                "steps": steps,
                "mode": mode,
                "only_vars": only_vars,
            }
        except:
            self.raise_invalid_action_json(action_json)


kmlAction = KMLAction()
