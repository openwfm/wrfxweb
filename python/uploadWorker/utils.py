from uploadWorker.app import app
from uploadWorker.logging import utils as loggingUtils
from uploadWorker.services.upload_queue_services import upload_queue_services
from api.services import CatalogEntryUploadServices as CatalogEntryUploadServices


from uploadWorker.logging import utils as loggingUtils
import zipfile

import os
import time

UPLOAD_EXTENSIONS = [".json", ".png", ".kmz"]
REFETCH_ATTEMPTS = 5


def process_catalog_entry_upload(catalog_entry_upload):
    if catalog_entry_upload == None:
        loggingUtils.log_upload_worker_ready()
        return

    loggingUtils.log_processing_catalog_entry_upload(catalog_entry_upload.id)
    time.sleep(10)

    loggingUtils.log_processed_catalog_entry_upload(catalog_entry_upload.id)
    next_catalog_entry_upload = fetch_catalog_entry_upload(REFETCH_ATTEMPTS)
    process_catalog_entry_upload(next_catalog_entry_upload)


def fetch_catalog_entry_upload(attempts):
    if attempts == 0:
        return None
    next_catalog_entry_upload_id = upload_queue_services.get_dequeue()

    if next_catalog_entry_upload_id == None:
        return None
    if next_catalog_entry_upload_id == -1:
        return fetch_catalog_entry_upload(attempts - 1)

    with app.app_context():
        next_catalog_entry_upload = CatalogEntryUploadServices.find_by_id(
            next_catalog_entry_upload_id
        )
        if next_catalog_entry_upload == None:
            loggingUtils.log_no_catalog_entry_upload(next_catalog_entry_upload_id)
            return fetch_catalog_entry_upload(attempts - 1)
        return next_catalog_entry_upload


def validate_zip_upload(catalog_entry_upload):
    upload_path = catalog_entry_upload.upload_path()
    if not valid_zip_upload(upload_path):
        os.remove(upload_path)
        catalog_entry_upload.destroy()


def valid_zip_upload(upload_path):
    try:
        with zipfile.ZipFile(upload_path) as zip_ref:
            zip_ref.testzip()
            for file_name in zip_ref.namelist():
                file_ext = os.path.splitext(file_name)[1]
                if file_ext not in UPLOAD_EXTENSIONS:
                    return False
        return True
    except zipfile.BadZipFile:
        return False
