from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from .serverKeys import LOG_FILE

import logging

db = SQLAlchemy()


def create_app():
    app = Flask(__name__, template_folder="../../fdds")
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///primary.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    if LOG_FILE:
        app.logger.setLevel(logging.DEBUG)
        handler = logging.FileHandler(LOG_FILE)
        app.logger.addHandler(handler)

    db.init_app(app)

    migrate = Migrate(app, db)

    return app


app = create_app()
