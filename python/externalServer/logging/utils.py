from externalServer.app import app

from externalServer.serverKeys import UPLOAD_SERVICE_DEBUG_LOGS

import datetime


def log_statement(area, message, standard_log):
    time_now = datetime.datetime.now().strftime("%Y-%m-%d:%H-%M-%S")

    if standard_log or UPLOAD_SERVICE_DEBUG_LOGS == "1":
        app.logger.info(f"[{area}] {message} : {time_now}")


def standard_log(area, message):
    log_statement(area, message, True)


def error_log(area, message):
    area = f"{area} ERROR"
    log_statement(area, message, True)


def log_upload_queue_error(catalog_entry_upload, error):
    upload_error_message = (
        f"catalog_entry_upload_id: {catalog_entry_upload.id}, error: {error}"
    )
    log_statement("UploadQueueError", upload_error_message, True)


def log_zip_queue_error(catalog_entry_id, error):
    upload_error_message = f"catalog_entry_id: {catalog_entry_id}, error: {error}"
    log_statement("ZipQueueError", upload_error_message, True)


def log_kml_queue_error(catalog_entry_id, error):
    upload_error_message = f"catalog_entry_id: {catalog_entry_id}, error: {error}"
    log_statement("KmlQueueError", upload_error_message, True)


def debug_log(message):
    log_statement("Debug", message, True)


def log_error(message):
    log_statement("ERROR", message, True)
