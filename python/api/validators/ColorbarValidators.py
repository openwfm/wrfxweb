from api.validators import LayerTimestampValidators as LayerTimestampValidators
from api.validators import utils as validationUtils
import api.encryption as encryption


def validate_create_json(json):
    if "png_url" not in json:
        raise ValueError("png_url is required")
    if "layer_timestamp_id" not in json:
        raise ValueError("layer_timestamp_id is required")
    if "levels" not in json:
        raise ValueError("levels is required")
    elif not isinstance(json["levels"], list):
        raise ValueError("levels must be a list of floats")

    png_url = validationUtils.validate_text(json["png_url"])
    encrypted_png_url = encryption.encrypt_png_url(png_url)

    layer_timestamp_id = LayerTimestampValidators.validate_id(
        json["layer_timestamp_id"]
    )

    levels = [validationUtils.validate_float(level) for level in json["levels"]]

    return {
        "encrypted_png_url": encrypted_png_url,
        "layer_timestamp_id": layer_timestamp_id,
        "levels": levels,
    }


def validate_id(colorbar_id):
    try:
        return validationUtils.validate_int_id(colorbar_id)
    except:
        raise ValueError("colorbar_id must be an integer")
