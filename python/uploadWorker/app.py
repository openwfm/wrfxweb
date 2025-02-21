from flask import Flask
from uploadWorker.workerKeys import (
    UPLOAD_WORKER_SECRET,
    UPLOAD_WORKER_LOG,
)

from api.db import db

import logging


def create_app():
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///primary.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    app.secret_key = UPLOAD_WORKER_SECRET

    if UPLOAD_WORKER_LOG:
        app.logger.setLevel(logging.DEBUG)
        handler = logging.FileHandler(UPLOAD_WORKER_LOG)
        app.logger.addHandler(handler)

    db.init_app(app)

    return app


app = create_app()
