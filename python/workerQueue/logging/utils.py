from workerQueue.app import app

from workerQueue.serviceKeys import UPLOAD_QUEUE_SERVICE_DEBUG_LOGS

import datetime


def log_statement(area, message, standard_log):
    time_now = datetime.datetime.now().strftime("%Y-%m-%d:%H-%M-%S")

    if standard_log or UPLOAD_QUEUE_SERVICE_DEBUG_LOGS == "1":
        app.logger.info(f"[{area}] {message} : {time_now}")


def debug_log(area, message):
    log_statement(f"{area} Debug", message, False)


def error_log(area, message):
    log_statement(f"{area} ERROR", message, True)


def standard_log(area, message):
    log_statement(area, message, True)
