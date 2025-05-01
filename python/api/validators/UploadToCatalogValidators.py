from api.validators import CatalogValidators as CatalogValidators
from api.validators import CatalogEntryUploadValidators as CatalogEntryUploadValidators
from api.validators import utils as validationUtils


def validate_create_json(json):
    if "catalog_id" not in json:
        raise ValueError("catalog_id is required")
    if "catalog_entry_upload_id" not in json:
        raise ValueError("catalog_entry_upload_id is required")

    catalog_id = CatalogValidators.validate_catalog_id(json["catalog_id"])
    catalog_entry_upload_id = CatalogEntryUploadValidators.validate_id(
        json["catalog_entry_upload_id"]
    )

    return {
        "catalog_id": catalog_id,
        "catalog_entry_upload_id": catalog_entry_upload_id,
    }


def validate_id(upload_to_catalog_id):
    try:
        id = validationUtils.validate_int_id(upload_to_catalog_id)
        return id
    except:
        raise ValueError("upload_to_catalog_id must be an integer")
