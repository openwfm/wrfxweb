from functools import wraps
from flask import request, abort


def upload_key_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not valid_upload_key():
            abort(403, "a valid upload key is required")
        else:
            return f(*args, **kwargs)

    return wrapper


def valid_upload_key():
    return True
