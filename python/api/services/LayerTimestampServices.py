from api.session import db_session
from api.models.layerTimestamp.LayerTimestamp import LayerTimestamp
from api.models.layerTimestamp.LayerTimestampCoords import LayerTimestampCoords
from api.validators import (
    LayerTimestampValidators as LayerTimestampValidators,
    SimLayerValidators as SimLayerValidators,
    utils as validationUtils,
)
from api.services import (
    AdminServices as AdminServices,
    ColorbarServices as ColorbarServices,
)
from api.apiKeys import UPLOAD_API_KEYS
import api.encryption as encryption

import api.logging.utils as logging
import os


def create(json, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")

        layer_timestamp_json = LayerTimestampValidators.validate_create_json(json)

        layer_timestamp = LayerTimestamp(
            sim_layer_id=layer_timestamp_json["sim_layer_id"],
            encrypted_png_url=layer_timestamp_json["encrypted_png_url"],
            encrypted_kml_url=layer_timestamp_json["encrypted_kml_url"],
            timestamp=layer_timestamp_json["timestamp"],
        )
        db_session.add(layer_timestamp)
        db_session.commit()

        for i, coord in enumerate(layer_timestamp_json["coords"]):
            layer_timestamp_coord = LayerTimestampCoords(
                latitude=coord[0],
                longitude=coord[1],
                index=i,
                layer_timestamp_id=layer_timestamp.id,
            )
            db_session.add(layer_timestamp_coord)

        db_session.commit()
        return layer_timestamp
    except Exception as e:
        logging.service_exception("LayerTimestamp", "create", e)
        return None


def delete(layer_timestamp, user, admin_services_api_key):
    if not AdminServices.isAdmin(user, admin_services_api_key):
        raise PermissionError("Invalid Admin")
    if not isinstance(layer_timestamp, LayerTimestamp):
        raise ValueError("provided layer_timestamp must be of instance layer_timestamp")
    colorbar = layer_timestamp.colorbar()
    if colorbar != None:
        ColorbarServices.delete(colorbar, user, admin_services_api_key)
    png_url = layer_timestamp.png_full_path()
    kml_url = layer_timestamp.kml_full_path()
    os.remove(png_url)
    os.remove(kml_url)
    layer_timestamp.destroy()


def find_by_id(layer_timestamp_id):
    try:
        validated_timestamp_id = LayerTimestampValidators.validate_id(
            layer_timestamp_id
        )
        return db_session.query(LayerTimestamp).get(validated_timestamp_id)
    except Exception as e:
        logging.service_exception("LayerTimestamp", "find", e)
        return None


def find_by_sim_layer_id(sim_layer_id):
    try:
        validated_sim_layer_id = SimLayerValidators.validate_id(sim_layer_id)
        return (
            db_session.query(LayerTimestamp)
            .filter_by(sim_layer_id=validated_sim_layer_id)
            .all()
        )
    except Exception as e:
        logging.service_exception("SimLayer", "find_by_sim_layer_id", e)
        return None


def find_by_sim_layer_id_and_timestamp(sim_layer_id, timestamp):
    try:
        validated_sim_layer_id = SimLayerValidators.validate_id(sim_layer_id)
        validated_timestamp = validationUtils.validate_timestamp(timestamp)
        return (
            db_session.query(LayerTimestamp)
            .filter_by(
                sim_layer_id=validated_sim_layer_id, timestamp=validated_timestamp
            )
            .first()
        )
    except Exception as e:
        logging.service_exception("SimLayer", "find_by_sim_layer_id_and_timestamp", e)
        return None


def find_by_png_url(png_url):
    try:
        png_url = validationUtils.validate_text(png_url)
        encrypted_png_url = encryption.encrypt_png_url(png_url)
        return (
            db_session.query(LayerTimestamp)
            .filter_by(encrypted_png_url=encrypted_png_url)
            .first()
        )
    except Exception as e:
        logging.service_exception("LayerTimestamp", "find_by_png_url", e)
        return None


def find_or_create(json, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")

        layer_timestamp = find_by_png_url(json["png_url"])
        if layer_timestamp == None:
            layer_timestamp = create(json, upload_api_key)
        return layer_timestamp
    except Exception as e:
        logging.service_exception("LayerTimestamp", "find_or_create", e)
        return None
