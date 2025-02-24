from flask import Flask
from api.db import db

# from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from clientServer.serverKeys import (
    CLIENT_LOG_FILE,
    CLIENT_SERVER_SECRET,
    ENCRYPTION_KEY,
    SERVER_ENCRYPTION_KEY,
)

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.fernet import Fernet
import logging

# db = SQLAlchemy()


def create_app():
    app = Flask(__name__, template_folder="../../fdds")

    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///primary.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_EXTENSIONS"] = [".json", ".png", ".kmz"]

    app.secret_key = CLIENT_SERVER_SECRET

    if CLIENT_LOG_FILE:
        app.logger.setLevel(logging.DEBUG)
        handler = logging.FileHandler(CLIENT_LOG_FILE)
        app.logger.addHandler(handler)

    db.init_app(app)

    migrate = Migrate(app, db)

    return app


app = create_app()
# aesgcm = AESGCM(ENCRYPTION_KEY)
# fernet = Fernet(SERVER_ENCRYPTION_KEY)
