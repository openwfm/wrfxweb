from workerQueue.serviceKeys import (
    WORKER_QUEUE_FILE,
)
import os
from workerQueue.logging import utils as loggingUtils

import threading


class WorkerQueue:
    def __init__(self):
        self.filename = WORKER_QUEUE_FILE
        self.lock = threading.Lock()
        if not os.path.exists(self.filename):
            open(self.filename, "a").close()

    def enqueue_upload(self, catalog_entry_upload_id):
        with self.lock:
            with open(WORKER_QUEUE_FILE, "a") as file:
                file.write(f"{catalog_entry_upload_id}\n")
        loggingUtils.log_enqueue(catalog_entry_upload_id)

    def dequeue(self):
        catalog_entry_upload_id = ""
        with self.lock:
            with open(WORKER_QUEUE_FILE, "r+") as file:
                lines = file.readlines()
                if len(lines) == 0:
                    return catalog_entry_upload_id
                catalog_entry_upload_id = lines[0]
                file.seek(0)
                file.truncate()
                file.writelines(lines[1:])
        loggingUtils.log_dequeue(catalog_entry_upload_id)
        return catalog_entry_upload_id

    def peek(self):
        with self.lock:
            with open(WORKER_QUEUE_FILE, "r") as file:
                return file.readline().strip("\n")


worker_queue = WorkerQueue()
