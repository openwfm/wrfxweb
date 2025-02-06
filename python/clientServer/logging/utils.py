from clientServer.app import app

from clientServer.serverKeys import DEBUG_LOGS

import datetime


def log_statement(area, message, standard_log):
    time_now = datetime.datetime.now().strftime("%Y-%m-%d:%H-%M-%S")

    if standard_log or DEBUG_LOGS == "1":
        app.logger.info(f"[{area}] {message} : {time_now}")


def log_login(message):
    log_statement("Login", message, True)


def debug_log_login(message):
    log_statement("Login", message, False)


def log_auth(message):
    log_statement("LoginRedirect", message, True)


def debug_log_auth(message):
    log_statement("LoginRedirect", message, False)


def debug_log(message):
    log_statement("Debug", message, True)


def log_error(message):
    log_statement("ERROR", message, True)
