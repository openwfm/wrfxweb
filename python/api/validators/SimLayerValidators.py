from api.services import LayerTypeServices as LayerTypeServices
from api.services import CatalogEntryServices as CatalogEntryServices
from api.validators import utils as validationUtils


def validate_create_json(json):
    if "layer_type_id" not in json:
        raise ValueError("layer_type_id is required")
    if "catalog_entry_id" not in json:
        raise ValueError("catalog_entry_id is required")
    if "domain" not in json:
        raise ValueError("domain is required")

    layer_type = LayerTypeServices.find_by_id(json["layer_type_id"])
    if layer_type == None:
        raise ValueError("must provide valid layer_type_id")
    validated_layer_type_id = layer_type.id

    catalog_entry = CatalogEntryServices.find_by_id(json["catalog_entry_id"])
    if catalog_entry == None:
        raise ValueError("must provide valid catalog_entry_id")
    validated_catalog_entry_id = catalog_entry.id

    validated_domain = validationUtils.validate_int_id(json["domain"])

    return {
        "layer_type_id": validated_layer_type_id,
        "catalog_entry_id": validated_catalog_entry_id,
        "domain": validated_domain,
    }


def validate_id(sim_layer_id):
    if type(sim_layer_id) is str:
        if not sim_layer_id.isdigit():
            raise ValueError("sim_layer_id must be an integer")
        return int(sim_layer_id)
    if type(sim_layer_id) is not int:
        raise ValueError("sim_layer_id must be an integer")
    return sim_layer_id
