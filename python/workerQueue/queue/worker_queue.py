from workerQueue.serviceKeys import (
    WORKER_QUEUE_FILE, WORKER_FAILED_ACTION_FILE
)
import os
from workerQueue.logging import utils as loggingUtils
import workerQueue.services.worker_services as workerServices
from workerQueue.services.constants import UPLOAD_ACTION, ZIP_ACTION, KML_ACTION

import threading

class FailedActionLog:
    def __init__(self):
        self.filename = WORKER_FAILED_ACTION_FILE
        self.lock = threading.Lock()
        if not os.path.exists(self.filename):
            open(self.filename, "a").close()

    def write_failed_action(self, queue_line):
        with self.lock:
            with open(self.filename, "a") as file:
                file.write(queue_line)
        self.log_failed_action(queue_line)
    
    def log_failed_action(self, queue_line):
        log_message = f"[FailedActionLog] {queue_line}"
        loggingUtils.log_statement("UploadEnqueue", log_message, True)


failed_action_log = FailedActionLog()



class WorkerQueue:
    def __init__(self):
        self.filename = WORKER_QUEUE_FILE
        self.lock = threading.Lock()
        if not os.path.exists(self.filename):
            open(self.filename, "a").close()

    def enqueue_upload(self, catalog_entry_upload_id):
        queue_line = f"{UPLOAD_ACTION} {catalog_entry_upload_id}"
        with self.lock:
            with open(WORKER_QUEUE_FILE, "a") as file:
                file.write(f"{queue_line}\n")
        self.log_enqueue(queue_line)

    def enqueue_zip(self, catalog_entry_id):
        queue_line = f"{ZIP_ACTION} {catalog_entry_id}"
        with self.lock:
            with open(WORKER_QUEUE_FILE, "a") as file:
                file.write(f"{queue_line}\n")

        self.log_enqueue(queue_line)

    def enqueue_kml(self, catalog_entry_id, kml_params):
        queue_line = f"{KML_ACTION} {catalog_entry_id} {kml_params["steps"]} {kml_params["mode"]} {kml_params["only_vars"]}"

        with self.lock:
            with open(WORKER_QUEUE_FILE, "a") as file:
                file.write(f"{queue_line}\n")
        self.log_enqueue(queue_line)

    def log_enqueue(self, queue_line):
        loggingUtils.log_statement("Enqueue", queue_line, True)

    def dequeue(self):
        queue_line = ""
        with self.lock:
            with open(WORKER_QUEUE_FILE, "r+") as file:
                lines = file.readlines()
                if len(lines) == 0:
                    return None
                queue_line = lines[0]
                file.seek(0)
                file.truncate()
                file.writelines(lines[1:])

        response_params = workerServices.parse_queue_line(queue_line)
        if response_params == None:
            failed_action_log.write_failed_action(queue_line)
            return self.dequeue()
        self.log_dequeue(queue_line)
        return response_params

    def log_dequeue(self, queue_line):
        loggingUtils.log_statement("Dequeue", queue_line, True)

    def peek(self):
        with self.lock:
            with open(WORKER_QUEUE_FILE, "r") as file:
                return file.readline().strip("\n")


worker_queue = WorkerQueue()
