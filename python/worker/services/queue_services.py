from worker.logging import utils as loggingUtils
from worker.workerKeys import (
    UPLOAD_QUEUE_SERVICE_API_KEY,
    UPLOAD_QUEUE_SERVICE_URL,
)
import requests

LOGGING_AREA = "QueueServices"


class QueueServices:
    def post_failed_action(self, action_params):
        post_url = f"{UPLOAD_QUEUE_SERVICE_URL}/fail"
        try:
            headers = {
                "Content-type": "application/json",
                "API-Key": UPLOAD_QUEUE_SERVICE_API_KEY,
            }
            response = requests.post(post_url, headers=headers, json=action_params)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            self.log_queue_service_error(f"{e}")
            return -1

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
                next_action_params = response.json()
                self.log_queue_service("Next Action Retreived")
                return next_action_params
            elif response.status_code == 204:
                self.log_queue_service("UploadQueueService is empty")
                return None
        except requests.exceptions.RequestException as e:
            self.log_queue_service_error(f"{e}")
            return -1

    def log_queue_service_error(self, message):
        loggingUtils.error_log(LOGGING_AREA, message)

    def log_queue_service(self, message):
        loggingUtils.standard_log(LOGGING_AREA, message)


queue_services = QueueServices()
