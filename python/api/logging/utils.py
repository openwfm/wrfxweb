from api.apiKeys import DB_LOG_FILE, DB_DEBUG_LOGS


import logging
import datetime

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.FileHandler(DB_LOG_FILE)
logger.addHandler(handler)


def log(area, message, standard_log):
    time_now = datetime.datetime.now().strftime("%Y-%m-%d:%H-%M-%S")

    if standard_log or DB_DEBUG_LOGS == "1":
        logger.info(f"[{area}] {message} : {time_now}")


def service_exception(model, service, message):
    log(model, f"{service} : {message}", True)
