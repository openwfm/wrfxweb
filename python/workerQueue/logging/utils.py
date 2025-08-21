from workerQueue.app import app

from workerQueue.serviceKeys import UPLOAD_QUEUE_SERVICE_DEBUG_LOGS

import datetime


def log_statement(area, message, standard_log):
    time_now = datetime.datetime.now().strftime("%Y-%m-%d:%H-%M-%S")

    if standard_log or UPLOAD_QUEUE_SERVICE_DEBUG_LOGS == "1":
        app.logger.info(f"[{area}] {message} : {time_now}")


def log_upload_worker(catalog_entry_upload_id):
    upload_message = f"catalog_entry_upload_id: {catalog_entry_upload_id}"
    log_statement("UploadWorker", upload_message, True)


def log_upload_worker_error(error):
    upload_error_message = f"error: {error}"
    log_statement("UploadWorkerError", upload_error_message, True)


def log_upload_enqueue(catalog_entry_upload_id):
    enqueue_message = f"catalog_entry_upload_id: {catalog_entry_upload_id}"
    log_statement("UploadEnqueue", enqueue_message, True)


def log_zip_worker(catalog_entry_id):
    upload_message = f"catalog_entry_id: {catalog_entry_id}"
    log_statement("ZipWorker", upload_message, True)


def log_zip_worker_error(error):
    zip_error_message = f"error: {error}"
    log_statement("ZipWorkerError", zip_error_message, True)


def log_zip_enqueue(catalog_entry_id):
    enqueue_message = f"catalog_entry_id: {catalog_entry_id}"
    log_statement("ZipEnqueue", enqueue_message, True)


def log_kml_worker(catalog_entry_id):
    kml_message = f"catalog_entry_id: {catalog_entry_id}"
    log_statement("KmlWorker", kml_message, True)


def log_kml_worker_error(error):
    kml_error_message = f"error: {error}"
    log_statement("KmlWorkerError", kml_error_message, True)


def log_kml_enqueue(catalog_entry_id):
    enqueue_message = f"catalog_entry_id: {catalog_entry_id}"
    log_statement("KmlEnqueue", enqueue_message, True)


def log_dequeue(catalog_entry_upload_id):
    dequeue_message = f"catalog_entry_upload_id: {catalog_entry_upload_id}"
    log_statement("Dequeue", dequeue_message, True)


def log_dequeue_error(dequeue_message):
    log_statement("Dequeue [ERROR]", dequeue_message, True)


def debug_log(message):
    log_statement("Debug", message, True)


def log_error(message):
    log_statement("ERROR", message, True)
