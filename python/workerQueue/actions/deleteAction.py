from workerQueue.actions.baseAction import BaseAction

DELETE_ACTION = "DELETE"


class DeleteAction(BaseAction):
    def __init__(self):
        super()
        self.LOGGING_AREA = "DeleteAction"

    def compose_queue_line(self, action_json):
        action_json = self.validate_action_json(action_json)
        catalog_entry_id = action_json["catalog_entry_id"]
        queue_line = f"{DELETE_ACTION} {catalog_entry_id}"

        return queue_line

    def parse_queue_line(self, queue_line):
        line_vars = queue_line.split(" ")
        action = line_vars[0]
        catalog_entry_id = line_vars[1]
        action_json = {
            "action": action,
            "catalog_entry_id": catalog_entry_id,
        }
        return self.validate_action_json(action_json)

    def validate_action_json(self, action_json):
        try:
            if action_json["action"] != DELETE_ACTION:
                self.raise_invalid_action_json(action_json)
            catalog_entry_id = action_json["catalog_entry_id"]
            if not self.validate_catalog_entry_id(catalog_entry_id):
                self.raise_invalid_action_json(action_json)
            return {
                "action": DELETE_ACTION,
                "catalog_entry_id": catalog_entry_id,
            }
        except:
            self.raise_invalid_action_json(action_json)


deleteAction = DeleteAction()
