from api.services import CatalogEntryServices as CatalogEntryServices
from api.services import CatalogServices as CatalogServices
from api.services import CatalogEntryUploadServices as CatalogEntryUploadServices
from api.validators import utils as validationUtils


def validate_update_json(json):
    validated_update_json = {}
    if "catalog_id" in json:
        catalog = CatalogServices.find_by_id(json["catalog_id"])
        if catalog == None:
            raise ValueError("must provide valid catalog_id")
        validated_update_json["catalog_id"] = catalog.id
    if "catalog_entry_id" in json:
        catalog_entry = CatalogEntryServices.find_by_id(json["catalog_entry_id"])
        if catalog_entry == None:
            raise ValueError("must provide valid catalog_entry_id")
        validated_update_json["catalog_entry_id"] = catalog_entry.id
    return validated_update_json


def validate_create_json(json):
    if "catalog_id" not in json:
        raise ValueError("catalog_id is required")
    if "catalog_entry_id" not in json and "catalog_entry_upload_id" not in json:
        raise ValueError("catalog_entry_id or catalog_entry_upload is required")
    catalog = CatalogServices.find_by_id(json["catalog_id"])
    if catalog == None:
        raise ValueError("must provide valid catalog_id")
    catalog_entry = CatalogEntryServices.find_by_id(json["catalog_entry_id"])
    if catalog_entry == None:
        raise ValueError("must provide valid catalog_entry_id")

    return {
        "catalog_id": catalog.id,
        "catalog_entry_id": catalog_entry.id,
    }


def validate_find_json(json):
    if "catalog_id" not in json:
        raise ValueError("catalog_id is required")
    if "catalog_entry_id" not in json:
        raise ValueError("catalog_entry_id is required")
    catalog_id = validationUtils.validate_int_id(json["catalog_id"])
    catalog_entry_id = validationUtils.validate_int_id(json["catalog_entry_id"])
    return {
        "catalog_id": catalog_id,
        "catalog_entry_id": catalog_entry_id,
    }
