from flask import Flask
from uploadQueueService.serviceKeys import (
    UPLOAD_QUEUE_SERVICE_SECRET,
    UPLOAD_QUEUE_SERVICE_LOG,
)

import logging


def create_app():
    app = Flask(__name__)

    app.secret_key = UPLOAD_QUEUE_SERVICE_SECRET

    if UPLOAD_QUEUE_SERVICE_LOG:
        app.logger.setLevel(logging.DEBUG)
        handler = logging.FileHandler(UPLOAD_QUEUE_SERVICE_LOG)
        app.logger.addHandler(handler)

    return app


app = create_app()
