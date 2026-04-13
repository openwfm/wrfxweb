from worker.app import app

import scripts.reprocess_simulations as script
from worker.workerKeys import UPLOAD_WORKER_API_KEY

from worker.actions.baseAction import BaseAction


class ProcessUploadAction(BaseAction):
    def __init__(self):
        super()
        self.LOGGING_AREA = "ProcessUploadAction"

    def validate_json(self, json):
        try:
            catalog_id = json["catalog_id"]
            job_id = json["job_id"]
            return {"catalog_id": catalog_id, "job_id": job_id}
        except:
            self.raise_validation_error("Invalid catalog_id or job_id")

    def process(self, json):
        process_upload_json = self.validate_json(json)
        job_id = process_upload_json["job_id"]
        catalog_id = process_upload_json["catalog_id"]
        upload_message = f"PROCESS_UPLOAD job_id: {job_id} catalog_id: {catalog_id}"
        self.log_action(upload_message)
        with app.app_context():
            script.unpack_simulation(job_id, None, catalog_id)

        process_upload_message = (
            f"PROCESS_UPLOAD COMPLETE job_id: {job_id} catalog_id: {catalog_id}"
        )
        self.log_action(process_upload_message)


process_upload_action = ProcessUploadAction()
