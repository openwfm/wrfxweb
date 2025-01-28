from ..app import app

from ..serverKeys import DEBUG_LOGS

import datetime


def log_statement(area, message):
    time_now = datetime.datetime.now().strftime("%Y-%m-%d:%H-%M-%S")

    if DEBUG_LOGS == "1":
        app.logger.info(f"[{area}] {message} : {time_now}")


def log_login(message):
    log_statement("Login", message)


def log_auth(message):
    log_statement("LoginRedirect", message)
