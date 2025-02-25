from api.db import db
from api.models.CatalogEntry import CatalogEntry
from api.models.CatalogEntryCatalog import CatalogEntryCatalog
from api.services import CatalogServices as CatalogServices
from api.apiKeys import CLIENT_SERVER_API_KEYS
from api.validators import CatalogEntryValidators as CatalogEntryValidators
from api.validators import CatalogValidators as CatalogValidators
from api.validators import utils as validationUtils


# catalog_entry_upload_params {
#        "catalog": catalog,
#        "zip_file": zip_file,
#        "uploader_id": current_user.id,
#        "entry_type": entry_type,
#    }
def create(json):
    try:
        catalog_entry_params = CatalogEntryValidators.validate_create_json(json)

        catalog_entry = CatalogEntry(
            uploader_id=catalog_entry_params["uploader_id"],
            entry_type=catalog_entry_params["entry_type"],
            from_utc=catalog_entry_params["from_utc"],
            to_utc=catalog_entry_params["to_utc"],
            description=catalog_entry_params["description"],
            manifest_path=catalog_entry_params["manifest_path"],
            job_id=catalog_entry_params["job_id"],
            zip_size=catalog_entry_params["zip_size"],
            kml_size=catalog_entry_params["kml_size"],
            processed_utc=catalog_entry_params["processed_utc"],
            run_utc=catalog_entry_params["run_utc"],
            zip_url=catalog_entry_params["zip_url"],
            kml_url=catalog_entry_params["kml_url"],
        )
        db.session.add(catalog_entry)
        db.session.commit()

        catalog_entry_catalog = CatalogEntryCatalog(
            catalog_id=catalog_entry_params["catalog_id"],
            catalog_entry_id=catalog_entry.id,
        )

        db.session.add(catalog_entry_catalog)
        db.session.commit()

        return catalog_entry
    except Exception:
        return None


def destroy(catalog_id, catalog_entry_id):
    pass


def destroy_all(catalog_id):
    pass


def find_by_id(catalog_entry_id):
    try:
        validated_catalog_entry_upload_id = CatalogEntryValidators.validate_id(
            catalog_entry_id
        )
        return CatalogEntry.query.get(validated_catalog_entry_upload_id)
    except Exception:
        return None


def user_entry(catalog_id, catalog_entry_id, user, client_server_api_key):
    try:
        if client_server_api_key not in CLIENT_SERVER_API_KEYS:
            raise PermissionError("Invalid ClientServerApiKey")

        catalog_entry = find_by_id(catalog_entry_id)
        catalog = CatalogServices.find_by_id(catalog_id)
        if catalog_entry == None or catalog == None:
            return None
        catalog_entry_catalog = CatalogEntryCatalog.query.filter_by(
            catalog_id=catalog.id, catalog_entry_id=catalog_entry.id
        ).first()

        if not catalog.user_has_access(user) or catalog_entry_catalog == None:
            return None

        return catalog_entry
    except Exception:
        return None


def user_entries(catalog_id, user, client_server_api_key):
    catalog = CatalogServices.user_catalog(user, catalog_id, client_server_api_key)
    if catalog == None:
        return []
    return catalog.entries()


def admin_entries(catalog_id, user, admin_services_api_key):
    catalog = CatalogServices.admin_catalog(user, catalog_id, admin_services_api_key)
    if catalog == None:
        return []
    return catalog.entries()


def find_all(catalog_id):
    pass
