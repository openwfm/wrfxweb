from clientServer.app import app

from clientServer.serverKeys import DEBUG_LOGS

import datetime
from flask_login import current_user


def log_statement(area, message, standard_log):
    time_now = datetime.datetime.now().strftime("%Y-%m-%d:%H-%M-%S")

    if standard_log or DEBUG_LOGS == "1":
        app.logger.info(f"[{area}] {message} : {time_now}")


def log_catalog_api_access_attempt(user, catalog_id):
    message = f"User {user.id} attempted to access API key for Catalog {catalog_id}"

    log_statement("Catalog", message, True)


def log_catalog_api_access_success(user, catalog_id):
    message = f"User {user.id} successfully accessed API key for Catalog {catalog_id}"

    log_statement("Catalog", message, True)


def log_login(message):
    log_statement("Login", message, True)


def debug_log_login(message):
    log_statement("Login", message, False)


def log_upload_queue_error(catalog_entry_upload, error):
    upload_error_message = (
        f"catalog_entry_upload_id: {catalog_entry_upload.id}, error: {error}"
    )
    log_statement("UploadQueueError", upload_error_message, True)


def log_upload(catalog_entry_upload):
    uploader = "ExternalApi"
    if not current_user.is_anonymous:
        uploader = f"{current_user.id}"
    upload_message = (
        f"{uploader} uploaded entry: catalog_entry_upload_id: {catalog_entry_upload.id}"
    )
    log_statement("Upload", upload_message, True)


def log_catalog_entry_catalog_create(catalog_entry_catalog, admin_id):
    catalog_id = catalog_entry_catalog.catalog_id
    catalog_entry_id = catalog_entry_catalog.catalog_entry_id
    message = f"<Admin {admin_id}> created <CatalogEntryCatalog {catalog_entry_catalog.id} catalog_id: {catalog_id} catalog_entry_id: {catalog_entry_id}>"
    log_statement("CatalogEntryCatalog", message, True)


def log_catalog_entry_catalog_delete(catalog_id, catalog_entry_id, admin_id):
    message = f"<Admin {admin_id}> deleted <CatalogEntryCatalog catalog_id: {catalog_id} catalog_entry_id: {catalog_entry_id}>"
    log_statement("CatalogEntryCatalog", message, True)


def log_auth(message):
    log_statement("LoginRedirect", message, True)


def debug_log_auth(message):
    log_statement("LoginRedirect", message, False)


def debug_log(message):
    log_statement("Debug", message, True)


def log_error(message):
    log_statement("ERROR", message, True)
