from workerQueue.actions.baseAction import BaseAction
from api.services import CatalogEntryUploadServices as CatalogEntryUploadServices

PROCESS_UPLOAD_ACTION = "PROCESS_UPLOAD"


class ProcessUploadAction(BaseAction):
    def __init__(self):
        super()
        self.LOGGING_AREA = "ProcessUploadAction"

    def parse_queue_line(self, queue_line):
        line_vars = queue_line.split(" ")
        action = line_vars[0]
        job_id = line_vars[1]
        catalog_id = line_vars[2] if len(line_vars) == 3 else None
        action_json = {"action": action, "job_id": job_id, "catalog_id": catalog_id}
        return self.validate_action_json(action_json)

    def compose_queue_line(self, action_json):
        action_json = self.validate_action_json(action_json)
        catalog_id = action_json["catalog_id"]
        job_id = action_json["job_id"]
        if catalog_id == None:
            queue_line = f"{PROCESS_UPLOAD_ACTION} {job_id}"
        else:
            queue_line = f"{PROCESS_UPLOAD_ACTION} {job_id} {catalog_id}"
        return queue_line

    def validate_action_json(self, action_json):
        try:
            if action_json["action"] != PROCESS_UPLOAD_ACTION:
                self.raise_invalid_action_json(action_json)
            catalog_id = action_json["catalog_id"]
            job_id = action_json["job_id"]
            if catalog_id != None:
                if not self.validate_catalog_id(catalog_id) or not self.validate_job_id(
                    job_id
                ):
                    self.raise_invalid_action_json(action_json)
            return {
                "action": PROCESS_UPLOAD_ACTION,
                "catalog_id": catalog_id,
                "job_id": job_id,
            }
        except:
            self.raise_invalid_action_json(action_json)


processUploadAction = ProcessUploadAction()
