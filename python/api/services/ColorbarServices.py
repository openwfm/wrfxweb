from api.session import db_session
import api.encryption as encryption
from api.models.colorbar.Colorbar import Colorbar
from api.validators import ColorbarValidators as ColorbarValidators
from api.validators import utils as validationUtils
from api.apiKeys import UPLOAD_API_KEYS

import api.logging.utils as logging
import datetime


def create(json, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")

        colorbar_json = ColorbarValidators.validate_create_json(json)
        colorbar = Colorbar(
            encrypted_png_url=colorbar_json["encrypted_png_url"],
            layer_timestamp_id=colorbar_json["layer_timestamp_id"],
            levels=colorbar_json["levels"],
            date_created=datetime.datetime.now().strftime("%Y-%m-%d"),
        )

        db_session.add(colorbar)
        db_session.commit()

        return colorbar
    except Exception as e:
        logging.service_exception("Colorbar", "create", e)
        return None


def find_by_id(colorbar_id):
    try:
        validated_catalog_entry_upload_id = ColorbarValidators.validate_id(colorbar_id)
        return db_session.query(Colorbar).get(validated_catalog_entry_upload_id)
    except Exception as e:
        logging.service_exception("Colorbar", "find", e)
        return None


def find_by_png_url(png_url):
    png_url = validationUtils.validate_text(png_url)
    encrypted_png_url = encryption.encrypt_png_url(png_url)
    return (
        db_session.query(Colorbar)
        .filter_by(encrypted_png_url=encrypted_png_url)
        .first()
    )


def find_or_create(json, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")

        colorbar = find_by_png_url(json["png_url"])
        if colorbar == None:
            colorbar = create(json, upload_api_key)
        return colorbar
    except Exception as e:
        logging.service_exception("Colorbar", "find_or_create", e)
        return None
