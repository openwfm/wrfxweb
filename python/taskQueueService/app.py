from flask import Flask
from taskQueueService.serviceKeys import (
    TASK_QUEUE_SERVICE_SECRET,
    TASK_QUEUE_SERVICE_LOG,
)

import logging


def create_app():
    app = Flask(__name__)

    app.secret_key = TASK_QUEUE_SERVICE_SECRET

    if TASK_QUEUE_SERVICE_LOG:
        app.logger.setLevel(logging.DEBUG)
        handler = logging.FileHandler(TASK_QUEUE_SERVICE_LOG)
        app.logger.addHandler(handler)

    return app


app = create_app()
