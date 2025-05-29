from api.session import db_session
import api.encryption as encryption
from api.models.colorbar.Colorbar import Colorbar
from api.models.colorbar.ColorbarLevels import ColorbarLevels
from api.validators import (
    ColorbarValidators as ColorbarValidators,
    LayerTimestampValidators as LayerTimestampValidators,
    utils as validationUtils,
)
from api.services import AdminServices as AdminServices
from api.apiKeys import UPLOAD_API_KEYS

import api.logging.utils as logging
import os


def create(json, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")

        colorbar_json = ColorbarValidators.validate_create_json(json)
        colorbar = Colorbar(
            encrypted_png_url=colorbar_json["encrypted_png_url"],
            layer_timestamp_id=colorbar_json["layer_timestamp_id"],
        )

        for i, level in enumerate(colorbar_json["levels"]):
            colorbar_level = ColorbarLevels(
                value=level, index=i, colorbar_id=colorbar.id
            )
            db_session.add(colorbar_level)

        db_session.add(colorbar)
        db_session.commit()

        return colorbar
    except Exception as e:
        logging.service_exception("Colorbar", "create", e)
        return None


def delete(colorbar, user, admin_services_api_key):
    if not AdminServices.isAdmin(user, admin_services_api_key):
        raise PermissionError("Invalid Admin")
    if not isinstance(colorbar, Colorbar):
        raise ValueError("provided colorbar must be of instance Colorbar")
    png_url = colorbar.png_full_path()
    os.remove(png_url)
    colorbar.destroy()


def find_by_id(colorbar_id):
    try:
        validated_catalog_entry_upload_id = ColorbarValidators.validate_id(colorbar_id)
        return db_session.query(Colorbar).get(validated_catalog_entry_upload_id)
    except Exception as e:
        logging.service_exception("Colorbar", "find_by_id", e)
        return None


def find_by_layer_timestamp_id(layer_timestamp_id):
    try:
        validated_layer_timestamp_id = LayerTimestampValidators.validate_id(
            layer_timestamp_id
        )
        return (
            db_session.query(Colorbar)
            .filter_by(layer_timestamp_id=validated_layer_timestamp_id)
            .first()
        )
    except Exception as e:
        logging.service_exception("Colorbar", "find_by_layer_timestamp_id", e)
        return None


def find_by_png_url(png_url):
    try:
        png_url = validationUtils.validate_text(png_url)
        encrypted_png_url = encryption.encrypt_png_url(png_url)
        return (
            db_session.query(Colorbar)
            .filter_by(encrypted_png_url=encrypted_png_url)
            .first()
        )
    except Exception as e:
        logging.service_exception("Colorbar", "find_by_png_url", e)
        return None


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
