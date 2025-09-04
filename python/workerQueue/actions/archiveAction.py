from workerQueue.actions.baseAction import BaseAction

ARCHIVE_ACTION = "ARCHIVE"


class ArchiveAction(BaseAction):
    def __init__(self):
        super()
        self.LOGGING_AREA = "ArchiveAction"

    def compose_queue_line(self, action_json):
        action_json = self.validate_action_json(action_json)
        catalog_entry_id = action_json["catalog_entry_id"]
        number_of_days = action_json["number_of_days"]
        queue_line = f"{ARCHIVE_ACTION} {catalog_entry_id} {number_of_days}"

        return queue_line

    def parse_queue_line(self, queue_line):
        line_vars = queue_line.split(" ")
        action = line_vars[0]
        catalog_entry_id = line_vars[1]
        number_of_days = line_vars[2]
        action_json = {
            "action": action,
            "catalog_entry_id": catalog_entry_id,
            "number_of_days": number_of_days,
        }
        return self.validate_action_json(action_json)

    def validate_action_json(self, action_json):
        try:
            if action_json["action"] != ARCHIVE_ACTION:
                self.raise_invalid_action_json(action_json)
            catalog_entry_id = action_json["catalog_entry_id"]
            if not self.validate_catalog_entry_id(catalog_entry_id):
                self.raise_invalid_action_json(action_json)
            number_of_days = action_json["number_of_days"]
            if not number_of_days.isdigit():
                self.raise_invalid_action_json(action_json)
            return {
                "action": ARCHIVE_ACTION,
                "catalog_entry_id": catalog_entry_id,
                "number_of_days": number_of_days,
            }
        except:
            self.raise_invalid_action_json(action_json)


archiveAction = ArchiveAction()
