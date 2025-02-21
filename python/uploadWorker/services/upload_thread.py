from uploadWorker.app import app
from uploadWorker.logging import utils as loggingUtils
from uploadWorker.services.upload_queue_services import upload_queue_services

import api.services.CatalogEntryUploadServices as CatalogEntryUploadServices

import threading
import time

UPLOAD_EXTENSIONS = [".json", ".png", ".kmz"]
REFETCH_ATTEMPTS = 5


class UploadThread:
    def __init__(self):
        self.thread = None

    def start(self, catalog_entry_upload_id):
        self.thread = threading.Thread(
            target=self.process_and_dequeue, args=[catalog_entry_upload_id]
        )
        self.thread.start()

    def process_and_dequeue(self, catalog_entry_upload_id):
        self.process_catalog_entry_upload_id(catalog_entry_upload_id)
        next_catalog_entry_upload_id = self.fetch_catalog_entry_upload_id(
            REFETCH_ATTEMPTS
        )
        if next_catalog_entry_upload_id != None:
            self.process_and_dequeue(next_catalog_entry_upload_id)

    def ready(self):
        return self.thread == None or not self.thread.is_alive()

    def process_catalog_entry_upload_id(self, catalog_entry_upload_id):
        with app.app_context():
            catalog_entry_upload = CatalogEntryUploadServices.find_by_id(
                catalog_entry_upload_id
            )

            if catalog_entry_upload == None:
                loggingUtils.log_no_catalog_entry_upload(catalog_entry_upload_id)
                return

            loggingUtils.log_processing_catalog_entry_upload(catalog_entry_upload.id)
            time.sleep(10)

            loggingUtils.log_processed_catalog_entry_upload(catalog_entry_upload.id)

    def fetch_catalog_entry_upload_id(self, attempts):
        if attempts == 0:
            return None
        next_catalog_entry_upload_id = upload_queue_services.get_dequeue()

        if next_catalog_entry_upload_id == None:
            return None
        if next_catalog_entry_upload_id == -1:
            return self.fetch_catalog_entry_upload_id(attempts - 1)
        return next_catalog_entry_upload_id


upload_thread = UploadThread()
