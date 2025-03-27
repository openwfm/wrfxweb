from flask import Flask

from clientServer.serverKeys import (
    CLIENT_LOG_FILE,
    CLIENT_SERVER_SECRET,
)

import logging


def create_app():
    app = Flask(__name__, template_folder="../../fdds")

    app.config["UPLOAD_EXTENSIONS"] = [".json", ".png", ".kmz"]

    app.secret_key = CLIENT_SERVER_SECRET

    if CLIENT_LOG_FILE:
        app.logger.setLevel(logging.DEBUG)
        handler = logging.FileHandler(CLIENT_LOG_FILE)
        app.logger.addHandler(handler)

    return app


app = create_app()
