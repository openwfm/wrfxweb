from api.session import db_session
from api.apiKeys import UPLOAD_API_KEYS
from api.models.catalogEntryCatalog.CatalogEntryCatalog import CatalogEntryCatalog
from api.validators import (
    CatalogEntryCatalogValidators as CatalogEntryCatalogValidators,
)
from api.validators import CatalogValidators as CatalogValidators
import api.logging.utils as logging


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
        create_params = CatalogEntryCatalogValidators.validate_create_json(json)
        catalog_entry_catalog = CatalogEntryCatalog(
            catalog_id=create_params["catalog_id"],
            catalog_entry_id=create_params["catalog_entry_id"],
            catalog_entry_upload_id=create_params["catalog_entry_upload_id"],
        )
        db_session.add(catalog_entry_catalog)
        db_session.commit()
    except Exception as e:
        logging.service_exception("CatalogEntryCatalog", "create", e)
        return None


def find_or_create(json, services_api_key):
    try:
        if services_api_key not in UPLOAD_API_KEYS:
            return None
        catalog_entry_catalog = find(json)
        if catalog_entry_catalog != None:
            return catalog_entry_catalog

        catalog_entry_catalog = create(json)

        return catalog_entry_catalog
    except Exception as e:
        logging.service_exception("CatalogEntryCatalog", "find_or_create", e)
        return None
