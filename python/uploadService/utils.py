from functools import wraps
from flask import request, abort
from uploadService.uploadServiceKeys import UPLOAD_SERVICE_API_KEY


def api_key_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        api_key = request.headers.get("API-Key")
        if api_key == None:
            return {"message": "Missing API key"}, 403
        if api_key == UPLOAD_SERVICE_API_KEY:
            return f(*args, **kwargs)
        return {"message": "Invalid API key"}, 401

    return wrapper
