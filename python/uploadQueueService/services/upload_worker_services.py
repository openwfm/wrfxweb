from uploadQueueService.logging import utils as loggingUtils
from uploadQueueService.serviceKeys import (
    UPLOAD_WORKER_URL,
    UPLOAD_WORKER_API_KEY,
)
import requests


class UploadWorkerServices:
    def post(self, catalog_entry_upload_id):
        post_url = f"{UPLOAD_WORKER_URL}/{catalog_entry_upload_id}"
        try:
            headers = {
                "Content-type": "application/json",
                "API-Key": UPLOAD_WORKER_API_KEY,
            }
            response = requests.post(post_url, headers=headers)
            response.raise_for_status()
            loggingUtils.log_upload_worker(catalog_entry_upload_id)
        except requests.exceptions.RequestException as e:
            loggingUtils.log_upload_worker_error(catalog_entry_upload_id, f"{e}")

    def ready(self):
        get_url = f"{UPLOAD_WORKER_URL}/ready"
        try:
            headers = {
                "Content-type": "application/json",
                "API-Key": UPLOAD_WORKER_API_KEY,
            }
            response = requests.get(get_url, headers=headers)
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            return False


upload_worker_services = UploadWorkerServices()
