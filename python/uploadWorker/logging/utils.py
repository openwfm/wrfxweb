from uploadWorker.app import app

from uploadWorker.workerKeys import UPLOAD_WORKER_DEBUG_LOGS

import datetime


def log_statement(area, message, standard_log):
    time_now = datetime.datetime.now().strftime("%Y-%m-%d:%H-%M-%S")

    if standard_log or UPLOAD_WORKER_DEBUG_LOGS == "1":
        app.logger.info(f"[{area}] {message} : {time_now}")


def log_unpacking_error(catalog_entry_upload_id, file_path):
    error_message = f"catalog_entry_upload_id: {catalog_entry_upload_id} - loading file {file_path} failed"
    log_statement("UploadThreadError", error_message, True)


def log_catalog_entry_fail(catalog_entry_upload, job_id):
    error_message = f"failed to create CatalogEntry with job_id {job_id} for CatalogEntryUpload<{catalog_entry_upload.id}>"
    log_statement("UploadThreadError", error_message, True)


def log_catalog_entry(catalog_entry_upload, catalog_entry):
    creation_message = f"created CatalogEntry<{catalog_entry.id}> from CatalogEntryUpload <{catalog_entry_upload.id}>"
    log_statement("UploadThread", creation_message, True)


def log_upload_worker_ready():
    worker_ready_message = f"done processing from queue. UploadWorker is ready"
    log_statement("UploadWorker", worker_ready_message, True)


def log_invalid_catalog_entry_upload(catalog_entry_upload_id):
    invalid_id_message = f"catalog_entry_upload_id: {catalog_entry_upload_id}"
    log_statement("InvalidCatalogEntryUploadId", invalid_id_message, True)


def log_no_catalog_entry_upload(catalog_entry_upload_id):
    no_catalog_entry = f"catalog_entry_upload_id: {catalog_entry_upload_id}"
    log_statement("NoCatalogEntryUploadFound", no_catalog_entry, True)


def log_upload_queue_service_error(error):
    upload_error_message = f"error when dequeueing UploadQueueService: {error}"
    log_statement("UploadQueueService", upload_error_message, True)


def log_upload_worker_post(catalog_entry_upload_id):
    upload_message = f"POST request catalog_entry_upload_id: {catalog_entry_upload_id}"
    log_statement("UploadWorker", upload_message, True)


def log_processing_catalog_entry_upload(catalog_entry_upload_id):
    upload_message = f"Processing catalog_entry_upload_id: {catalog_entry_upload_id}"
    log_statement("UploadWorker", upload_message, True)


def log_processed_catalog_entry_upload(catalog_entry_upload_id):
    upload_message = f"Processed catalog_entry_upload_id: {catalog_entry_upload_id}"
    log_statement("UploadWorker", upload_message, True)


def log_upload_queue_service(catalog_entry_upload_id):
    upload_message = f"catalog_entry_upload_id: {catalog_entry_upload_id}"
    log_statement("UploadQueueService", upload_message, True)


def log_upload_queue_service_empty():
    upload_message = "UploadQueueService is empty"
    log_statement("UploadQueueService", upload_message, True)


def debug_log(message):
    log_statement("Debug", message, True)


def log_error(message):
    log_statement("ERROR", message, True)
