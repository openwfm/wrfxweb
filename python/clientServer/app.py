from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from clientServer.serverKeys import LOG_FILE, CLIENT_SERVER_SECRET, ENCRYPTION_KEY

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import logging

db = SQLAlchemy()


def create_app():
    app = Flask(__name__, template_folder="../../fdds")

    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///primary.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.secret_key = CLIENT_SERVER_SECRET

    if LOG_FILE:
        app.logger.setLevel(logging.DEBUG)
        handler = logging.FileHandler(LOG_FILE)
        app.logger.addHandler(handler)

    db.init_app(app)

    migrate = Migrate(app, db)

    return app


app = create_app()
aesgcm = AESGCM(ENCRYPTION_KEY)
