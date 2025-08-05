from functools import wraps
from flask import request
from externalServer.serverKeys import UPLOAD_SERVICE_API_KEY
import api.services.CatalogServices as CatalogServices


def api_key_required(f):
    @wraps(f)
    def catalog_wrapper(catalog_id):
        api_key = request.headers.get("API-Key")
        if api_key == None:
            return {"message": "Missing API key"}, 403
        if api_key == UPLOAD_SERVICE_API_KEY:
            return f(catalog_id)
        catalog = CatalogServices.find_by_id(catalog_id)
        if catalog == None:
            return {"message": "Invalid API key"}, 401
        if catalog.verify_upload_key(api_key):
            return f(catalog_id)
        return {"message": "Invalid API key"}, 401

    return catalog_wrapper


def universal_api_key_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        api_key = request.headers.get("API-Key")
        if api_key == None:
            return {"message": "Missing API key"}, 403
        if api_key == UPLOAD_SERVICE_API_KEY:
            return f(*args, **kwargs)
        return {"message": "Invalid API key"}, 401

    return wrapper
