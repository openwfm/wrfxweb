from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()


def create_api():
    api = Flask(__name__)
    api.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///data.db"
    api.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(api)

    migrate = Migrate(api, db)

    return api


api = create_api()
