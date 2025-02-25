from api.services import CatalogEntryServices as CatalogEntryServices
from api.services import CatalogServices as CatalogServices
from api.validators import utils as validationUtils


def validate_create_json(json):
    if "catalog_id" not in json:
        raise ValueError("catalog_id is required")
    if "catalog_entry_id" not in json:
        raise ValueError("catalog_entry_id is required")
    catalog = CatalogServices.find_by_id(json["catalog_id"])
    catalog_entry = CatalogEntryServices.find_by_id(json["catalog_entry_id"])

    if catalog == None or catalog_entry == None:
        raise ValueError("must provide valid catalog_id and catalog_entry_id")

    return {"catalog_id": catalog.id, "catalog_entry_id": catalog_entry.id}


def validate_find_json(json):
    if "catalog_id" not in json:
        raise ValueError("catalog_id is required")
    if "catalog_entry_id" not in json:
        raise ValueError("catalog_entry_id is required")
    catalog_id = validationUtils.validate_int_id(json["catalog_id"])
    catalog_entry_id = validationUtils.validate_int_id(json["catalog_entry_id"])
    return {"catalog_id": catalog_id, "catalog_entry_id": catalog_entry_id}
