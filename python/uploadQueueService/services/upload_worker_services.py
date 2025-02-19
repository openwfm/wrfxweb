from uploadQueueService.logging import utils as loggingUtils
from uploadQueueService.serviceKeys import (
    UPLOAD_WORKER_URL,
    UPLOAD_WORKER_API_KEY,
)
import requests


class UploadWorkerServices:
    def __init__(self):
        self.waiting_on_upload_worker = False

    def post(self, catalog_entry_upload_id):
        if self.waiting_on_upload_worker:
            return
        post_url = f"{UPLOAD_WORKER_URL}/{catalog_entry_upload_id}"
        try:
            headers = {
                "Content-type": "application/json",
                "API-Key": UPLOAD_WORKER_API_KEY,
            }
            response = requests.post(post_url, headers=headers)
            response.raise_for_status()
            loggingUtils.log_upload_worker(catalog_entry_upload_id)
            self.waiting_on_upload_worker = True
        except requests.exceptions.RequestException as e:
            loggingUtils.log_upload_worker_error(catalog_entry_upload_id, f"{e}")


upload_worker_services = UploadWorkerServices()
