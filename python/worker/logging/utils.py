from worker.app import app

from worker.workerKeys import UPLOAD_WORKER_DEBUG_LOGS

import datetime


def log_statement(area, message, standard_log):
    time_now = datetime.datetime.now().strftime("%Y-%m-%d:%H-%M-%S")

    if standard_log or UPLOAD_WORKER_DEBUG_LOGS == "1":
        app.logger.info(f"[{area}] {message} : {time_now}")


def standard_log(area, message):
    log_statement(area, message, True)


def error_log(area, message):
    error_message = f"ERROR: {message}"
    log_statement(area, error_message, True)


def debug_log(area, message):
    log_statement(area, message, False)
