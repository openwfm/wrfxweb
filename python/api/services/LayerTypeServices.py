from api.session import db_session
from api.models.layerType.LayerType import LayerType
from api.validators import LayerTypeValidators as LayerTypeValidators
from api.validators import utils as validationUtils
from api.apiKeys import UPLOAD_API_KEYS

import api.logging.utils as logging


def create(json, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")

        layer_type_json = LayerTypeValidators.validate_create_json(json)
        layer_type = LayerType(
            name=layer_type_json["name"],
        )

        db_session.add(layer_type)
        db_session.commit()

        return layer_type
    except Exception as e:
        logging.service_exception("LayerType", "create", e)
        return None


def find_by_name(name):
    try:
        validated_name = validationUtils.validate_text(name)

        return db_session.query(LayerType).filter_by(name=validated_name).first()
    except Exception as e:
        logging.service_exception("LayerType", "find", e)
        return None


def find_by_id(layer_type_id):
    try:
        validated_layer_type_id = LayerTypeValidators.validate_id(layer_type_id)
        return db_session.query(LayerType).get(validated_layer_type_id)
    except Exception:
        return None


def find_or_create(json, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")

        layer_type = find_by_name(json["name"])
        if layer_type == None:
            layer_type = create(json, upload_api_key)
        return layer_type
    except Exception as e:
        logging.service_exception("LayerType", "find_or_create", e)
        return None
