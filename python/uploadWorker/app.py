from flask import Flask
from uploadWorker.workerKeys import (
    UPLOAD_WORKER_SECRET,
    UPLOAD_WORKER_LOG,
)

import logging


def create_app():
    app = Flask(__name__)

    app.secret_key = UPLOAD_WORKER_SECRET

    if UPLOAD_WORKER_LOG:
        app.logger.setLevel(logging.DEBUG)
        handler = logging.FileHandler(UPLOAD_WORKER_LOG)
        app.logger.addHandler(handler)

    return app


app = create_app()
