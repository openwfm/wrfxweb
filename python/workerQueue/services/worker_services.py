from workerQueue.serviceKeys import (
    WORKER_URL,
    UPLOAD_WORKER_API_KEY,
)
import requests


class WorkerServices:
    def post(self, queue_line):
        try:
            service_vars = self.parse_service_vars(queue_line)

            response = requests.post(
                self.post_url(service_vars),
                headers=self.headers(),
                json=self.json_body(service_vars),
            )
            response.raise_for_status()
            self.log_post(service_vars)
        except Exception as e:
            self.log_post_error(e)

    def parse_service_vars(self, queue_line):
        return {}

    def post_url(self, service_vars):
        return WORKER_URL

    def headers(self):
        headers = {
            "Content-type": "application/json",
            "API-Key": UPLOAD_WORKER_API_KEY,
        }
        return headers

    def json_body(self, service_vars):
        return {}

    def log_post(self, service_vars):
        pass

    def log_post_error(self, e):
        pass

    def ready(self):
        try:
            response = requests.get(self.ready_url(), headers=self.headers())
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException:
            return False

    def ready_url(self):
        return f"{WORKER_URL}/ready"
