from api.validators import LayerTimestampValidators as LayerTimestampValidators
from api.validators import utils as validationUtils


def validate_create_json(json):
    if "name" not in json:
        raise ValueError("name is required")

    validated_name = validate_name(json["name"])
    return {
        "name": validated_name,
    }


def validate_name(name):
    try:
        return validationUtils.validate_text(name)
    except:
        raise ValueError("[LayerTypeValidator] name must be a String")
