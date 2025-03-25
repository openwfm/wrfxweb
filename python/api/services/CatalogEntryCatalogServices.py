from api.session import db_session
from api.apiKeys import UPLOAD_API_KEYS
from api.models.catalogEntryCatalog.CatalogEntryCatalog import CatalogEntryCatalog
from api.validators import (
    CatalogEntryCatalogValidators as CatalogEntryCatalogValidators,
    CatalogEntryUploadValidators as CatalogEntryUploadValidators,
    CatalogValidators as CatalogValidators,
)
import api.logging.utils as logging


class InvalidAPIKey(Exception):
    def __init__(self):
        self.message = "Provided API Key was not valid"


# make private
def find(json):
    find_params = CatalogEntryCatalogValidators.validate_find_json(json)
    catalog_id = find_params["catalog_id"]
    catalog_entry_id = find_params["catalog_entry_id"]

    return (
        db_session.query(CatalogEntryCatalog)
        .filter_by(catalog_id=catalog_id, catalog_entry_id=catalog_entry_id)
        .first()
    )


def create(json):
    try:
        print("CatalogEntryCatalog create 0")
        create_params = CatalogEntryCatalogValidators.validate_create_json(json)
        print("CatalogEntryCatalog create 1")
        catalog_entry_catalog = CatalogEntryCatalog(
            catalog_id=create_params["catalog_id"],
            catalog_entry_id=create_params["catalog_entry_id"],
        )
        db_session.add(catalog_entry_catalog)
        db_session.commit()
    except Exception as e:
        logging.service_exception("CatalogEntryCatalog", "create", e)
        return None


def update(catalog_entry_catalog, json, api_key):
    try:
        if api_key not in UPLOAD_API_KEYS:
            raise InvalidAPIKey()
        update_params = CatalogEntryCatalogValidators.validate_update_json(json)
        catalog_entry_catalog.update(update_params)
        db_session.commit()
    except Exception as e:
        logging.service_exception("CatalogEntryCatalog", "update", e)
    return catalog_entry_catalog


def find_or_create(json, services_api_key):
    try:
        print("CatalogEntryCatalog 0")
        if services_api_key not in UPLOAD_API_KEYS:
            raise InvalidAPIKey()
        print("CatalogEntryCatalog 1")
        catalog_entry_catalog = find(json)
        print("CatalogEntryCatalog 2")
        if catalog_entry_catalog != None:
            return catalog_entry_catalog

        catalog_entry_catalog = create(json)
        print("CatalogEntryCatalog 3")

        return catalog_entry_catalog
    except Exception as e:
        logging.service_exception("CatalogEntryCatalog", "find_or_create", e)
        return None


def find_by_catalog_entry_upload_id(catalog_entry_upload_id, api_key):
    try:
        if api_key not in UPLOAD_API_KEYS:
            raise InvalidAPIKey()
        catalog_entry_upload_id = CatalogEntryUploadValidators.validate_id(
            catalog_entry_upload_id
        )
        catalog_entry_catalogs = (
            db_session.query(CatalogEntryCatalog)
            .filter_by(catalog_entry_upload_id=catalog_entry_upload_id)
            .all()
        )
        return catalog_entry_catalogs

    except Exception as e:
        logging.service_exception(
            "CatalogEntryCatalog", "find_by_catalog_entry_upload_id", e
        )
        return []
