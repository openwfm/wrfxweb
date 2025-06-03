from api.services import SimLayerServices as SimLayerServices
from api.validators import utils as validationUtils
import api.encryption as encryption


def validate_create_json(json):
    if "png_url" not in json:
        raise ValueError("png_url is required")
    if "kml_url" not in json:
        raise ValueError("kml_url is required")
    if "timestamp" not in json:
        raise ValueError("timestamp is required")
    if "sim_layer_id" not in json:
        raise ValueError("layer_timestamp_id is required")
    if "coords" not in json:
        raise ValueError("coords is required")
    elif not isinstance(json["coords"], list) or len(json["coords"]) != 4:
        raise ValueError("coords must be a list of 4 floats")

    png_url = validationUtils.validate_text(json["png_url"])
    encrypted_png_url = encryption.encrypt_png_url(png_url)
    kml_url = validationUtils.validate_text(json["kml_url"])
    encrypted_kml_url = encryption.encrypt_png_url(kml_url)

    timestamp = validationUtils.validate_timestamp(json["timestamp"])

    sim_layer = SimLayerServices.find_by_id(json["sim_layer_id"])
    if sim_layer == None:
        raise ValueError("[LayerTypeValidators] must provide valid sim_layer_id")
    validated_sim_layer_id = sim_layer.id

    coords = [validationUtils.validate_coord(coord) for coord in json["coords"]]

    return {
        "timestamp": timestamp,
        "encrypted_png_url": encrypted_png_url,
        "encrypted_kml_url": encrypted_kml_url,
        "sim_layer_id": validated_sim_layer_id,
        "coords": coords,
    }


def validate_id(layer_timestamp_id):
    try:
        return validationUtils.validate_int_id(layer_timestamp_id)
    except:
        raise ValueError("layer_timestamp_id must be an integer")
