from flask import Flask
from uploadService.uploadServiceKeys import (
    UPLOAD_SERVICE_LOG_FILE,
    UPLOAD_SERVICE_SECRET,
)

import logging


def create_app():
    app = Flask(__name__)

    app.config["UPLOAD_EXTENSIONS"] = [".json", ".png", ".kmz"]

    app.secret_key = UPLOAD_SERVICE_SECRET

    if UPLOAD_SERVICE_LOG_FILE:
        app.logger.setLevel(logging.DEBUG)
        handler = logging.FileHandler(UPLOAD_SERVICE_LOG_FILE)
        app.logger.addHandler(handler)

    return app


app = create_app()
