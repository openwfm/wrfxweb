from uploadWorker.logging import utils as loggingUtils
from uploadWorker.workerKeys import (
    UPLOAD_QUEUE_SERVICE_API_KEY,
    UPLOAD_QUEUE_SERVICE_URL,
)
import requests


class UploadQueueServices:
    def get_dequeue(self):
        get_url = f"{UPLOAD_QUEUE_SERVICE_URL}/dequeue"
        try:
            headers = {
                "Content-type": "application/json",
                "API-Key": UPLOAD_QUEUE_SERVICE_API_KEY,
            }
            response = requests.get(get_url, headers=headers)
            response.raise_for_status()
            if response.status_code == 200:
                next_catalog_entry_upload_id = response.json()[
                    "catalog_entry_upload_id"
                ]
                if not next_catalog_entry_upload_id.isdigit():
                    loggingUtils.log_invalid_catalog_entry_upload(
                        next_catalog_entry_upload_id
                    )
                    return -1
                loggingUtils.log_upload_queue_service(next_catalog_entry_upload_id)
                return int(next_catalog_entry_upload_id)
            elif response.status_code == 204:
                loggingUtils.log_upload_queue_service_empty()
                return None
        except requests.exceptions.RequestException as e:
            loggingUtils.log_upload_queue_service_error(f"{e}")
            return -1


upload_queue_services = UploadQueueServices()
