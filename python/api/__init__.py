from .api import db, api
from . import routes

from .apiKeys import API_SECRET

api.secret_key = API_SECRET

with api.app_context():
    db.create_all()
