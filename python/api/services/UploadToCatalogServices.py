from api.session import db_session
from api.models.uploadToCatalog.UploadToCatalog import UploadToCatalog
from api.validators import UploadToCatalogValidators as UploadToCatalogValidators
from api.validators import CatalogEntryUploadValidators as CatalogEntryUploadValidators
from api.apiKeys import UPLOAD_API_KEYS

import api.logging.utils as logging


def create(json, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        create_params = UploadToCatalogValidators.validate_create_json(json)

        upload_to_catalog = UploadToCatalog(
            catalog_id=create_params["catalog_id"],
            catalog_entry_upload_id=create_params["catalog_entry_upload_id"],
        )

        db_session.add(upload_to_catalog)
        db_session.commit()

        return upload_to_catalog
    except Exception as e:
        logging.service_exception("UploadToCatalog", "create", e)
        return None


def find_by_catalog_entry_upload_id(catalog_entry_upload_id, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        validated_catalog_entry_upload_id = CatalogEntryUploadValidators.validate_id(
            catalog_entry_upload_id
        )
        return (
            db_session.query(UploadToCatalog)
            .filter_by(catalog_entry_upload_id=validated_catalog_entry_upload_id)
            .all()
        )
    except Exception as e:
        logging.service_exception(
            "UploadToCatalog", "find_by_catalog_entry_upload_id", e
        )
        return []


def find(json, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        params = UploadToCatalogValidators.validate_create_json(json)
        return (
            db_session.query(UploadToCatalog)
            .filter_by(
                catalog_entry_upload_id=params["catalog_entry_upload_id"],
                catalog_id=params["catalog_id"],
            )
            .first()
        )
    except Exception as e:
        logging.service_exception("UploadToCatalog", "find", e)
        return None


def find_or_create(json, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        upload_to_catalog = find(json, upload_api_key)
        if upload_to_catalog == None:
            return create(json, upload_api_key)
        return upload_to_catalog
    except Exception as e:
        logging.service_exception("UploadToCatalog", "find_or_create", e)
        return None
