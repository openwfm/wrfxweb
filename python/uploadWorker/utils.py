from uploadWorker.logging import utils as loggingUtils
from uploadWorker.services.upload_queue_services import upload_queue_services

import time


from uploadWorker.logging import utils as loggingUtils
import zipfile

import os

UPLOAD_EXTENSIONS = [".json", ".png", ".kmz"]


def process_catalog_entry_upload(catalog_entry_upload):
    loggingUtils.log_processing_catalog_entry_upload(catalog_entry_upload["id"])
    time.sleep(10)
    next_catalog_entry_upload_id = upload_queue_services.get_dequeue()

    next_catalog_entry_upload = validate_catalog_entry_upload(
        next_catalog_entry_upload_id
    )
    if not next_catalog_entry_upload == None:
        process_catalog_entry_upload(next_catalog_entry_upload)
    else:
        loggingUtils.log_upload_worker_ready()


def validate_catalog_entry_upload(catalog_entry_upload_id):
    # if not catalog_entry_upload_id.isdigit():
    #     abort(400, "Posted catalog_entry_upload_id must be an integer")
    if catalog_entry_upload_id == "":
        return None
    catalog_entry_upload = {"id": catalog_entry_upload_id}
    return catalog_entry_upload


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
