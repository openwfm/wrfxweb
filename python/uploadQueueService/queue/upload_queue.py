from uploadQueueService.serviceKeys import (
    UPLOAD_QUEUE_SERVICE_QUEUE,
)
import os
from uploadQueueService.logging import utils as loggingUtils

import threading


class UploadQueue:
    def __init__(self):
        self.filename = UPLOAD_QUEUE_SERVICE_QUEUE
        self.lock = threading.Lock()
        if not os.path.exists(self.filename):
            open(self.filename, "a").close()

    def enqueue(self, catalog_entry_upload_id):
        with self.lock:
            with open(UPLOAD_QUEUE_SERVICE_QUEUE, "a") as file:
                file.write(f"{catalog_entry_upload_id}\n")
        loggingUtils.log_enqueue(catalog_entry_upload_id)

    def dequeue(self):
        catalog_entry_upload_id = ""
        with self.lock:
            with open(UPLOAD_QUEUE_SERVICE_QUEUE, "r+") as file:
                lines = file.readlines()
                catalog_entry_upload_id = lines[0]
                file.seek(0)
                file.truncate()
                file.writelines(lines[1:])
        loggingUtils.log_dequeue(catalog_entry_upload_id)
        return catalog_entry_upload_id

    def peek(self):
        with self.lock:
            with open(UPLOAD_QUEUE_SERVICE_QUEUE, "r") as file:
                return file.readline().strip("\n")


upload_queue = UploadQueue()
