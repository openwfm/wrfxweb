from api.db import db
from api.apiKeys import ADMIN_SERVICES_API_KEY
from api.models.CatalogEntryCatalog import CatalogEntryCatalog
from api.validators import (
    CatalogEntryCatalogValidators as CatalogEntryCatalogValidators,
)
from api.validators import CatalogValidators as CatalogValidators


# make private
def find(json):
    find_params = CatalogEntryCatalogValidators.validate_find_json(json)
    catalog_id = find_params["catalog_id"]
    catalog_entry_id = find_params["catalog_entry_id"]

    return CatalogEntryCatalog.query.filter_by(
        catalog_id=catalog_id, catalog_entry_id=catalog_entry_id
    ).first()


def create(json):
    try:
        catalog_entry_catalog = find(json)
        if catalog_entry_catalog != None:
            return catalog_entry_catalog
        create_params = CatalogEntryCatalogValidators.validate_create_json(json)
        catalog_entry_catalog = CatalogEntryCatalog(
            catalog_id=create_params["catalog_id"],
            catalog_entry_id=create_params["catalog_entry_id"],
        )
        db.session.add(catalog_entry_catalog)
        db.session.commit()
    except:
        return None


def admin_find_or_create(json, admin_services_api_key):
    try:
        if admin_services_api_key != ADMIN_SERVICES_API_KEY:
            return None

        catalog_entry_catalog = create(json)

        return catalog_entry_catalog
    except:
        return None


def admin_destroy(json, admin_services_api_key):
    try:
        if admin_services_api_key != ADMIN_SERVICES_API_KEY:
            return None
        catalog_entry_catalog = find(json)
        if catalog_entry_catalog != None:
            catalog_entry_catalog.destroy()
    except:
        return None
