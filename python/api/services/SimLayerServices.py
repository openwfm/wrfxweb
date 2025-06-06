from api.session import db_session
from api.models.simLayer.SimLayer import SimLayer
from api.validators import (
    SimLayerValidators as SimLayerValidators,
    LayerTypeValidators as LayerTypeValidators,
    CatalogEntryValidators as CatalogEntryValidators,
    utils as validationUtils,
)
from api.services import (
    AdminServices as AdminServices,
    LayerTimestampServices as LayerTimestampServices,
)
from api.apiKeys import UPLOAD_API_KEYS

import api.logging.utils as logging


def create(json, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")

        sim_layer_json = SimLayerValidators.validate_create_json(json)
        sim_layer = SimLayer(
            layer_type_id=sim_layer_json["layer_type_id"],
            catalog_entry_id=sim_layer_json["catalog_entry_id"],
            domain=sim_layer_json["domain"],
        )

        db_session.add(sim_layer)
        db_session.commit()

        return sim_layer
    except Exception as e:
        logging.service_exception("SimLayer", "create", e)
        return None


def delete(sim_layer, upload_server_api_key):
    if upload_server_api_key not in UPLOAD_API_KEYS:
        raise PermissionError("Invalid UploadApiKey")
    if not isinstance(sim_layer, SimLayer):
        raise ValueError("provided sim_layer must be of instance SimLayer")
    for layer_timestamp in sim_layer.layer_timestamps():
        LayerTimestampServices.delete(layer_timestamp, upload_server_api_key)
    sim_layer.destroy()


def find_by_id(sim_layer_id):
    try:
        validated_sim_layer_id = SimLayerValidators.validate_id(sim_layer_id)
        return db_session.query(SimLayer).get(validated_sim_layer_id)
    except Exception as e:
        logging.service_exception("SimLayer", "find_by_id", e)
        return None


def find(catalog_entry_id, domain, layer_type_id):
    try:
        validated_layer_type_id = LayerTypeValidators.validate_id(layer_type_id)
        validated_catalog_entry_id = CatalogEntryValidators.validate_id(
            catalog_entry_id
        )
        validated_domain = validationUtils.validate_int_id(domain)
        return (
            db_session.query(SimLayer)
            .filter_by(
                catalog_entry_id=validated_catalog_entry_id,
                domain=validated_domain,
                layer_type_id=validated_layer_type_id,
            )
            .first()
        )
    except Exception as e:
        logging.service_exception("SimLayer", "find", e)
        return None


def find_by_catalog_entry_id_and_domain(catalog_entry_id, domain):
    try:
        validated_catalog_entry_id = CatalogEntryValidators.validate_id(
            catalog_entry_id
        )
        validated_domain = validationUtils.validate_int_id(domain)
        return (
            db_session.query(SimLayer)
            .filter_by(
                catalog_entry_id=validated_catalog_entry_id, domain=validated_domain
            )
            .all()
        )
    except Exception as e:
        logging.service_exception("SimLayer", "find_by_catalog_entry_id_and_domain", e)
        return None


def find_or_create(json, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")

        sim_layer = find(
            json["catalog_entry_id"], json["domain"], json["layer_type_id"]
        )
        if sim_layer == None:
            sim_layer = create(json, upload_api_key)
        return sim_layer
    except Exception as e:
        logging.service_exception("SimLayer", "find_or_create", e)
        return None
