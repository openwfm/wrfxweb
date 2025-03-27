from api.session import db_session
from api.models.catalogEntry.CatalogEntry import CatalogEntry
from api.models.catalogEntryCatalog.CatalogEntryCatalog import CatalogEntryCatalog
from api.services import CatalogServices as CatalogServices
from api.apiKeys import CLIENT_SERVER_API_KEYS, UPLOAD_API_KEYS
from api.validators import CatalogEntryValidators as CatalogEntryValidators
from api.validators import CatalogValidators as CatalogValidators
from api.validators import utils as validationUtils
import api.logging.utils as logging
import api.encryption as encryption

from sqlalchemy import select


def find_catalog_entry_catalogs(catalog_id, catalog_entry_id):
    catalog_entry_catalog = (
        db_session.query(CatalogEntryCatalog)
        .filter_by(catalog_id=catalog_id, catalog_entry_id=catalog_entry_id)
        .first()
    )
    return catalog_entry_catalog


def create_catalog_entry_catalog(catalog_id, catalog_entry_id):
    if catalog_id != 0:
        if find_catalog_entry_catalogs(catalog_id, catalog_entry_id) != None:
            return
        catalog_entry_catalog = CatalogEntryCatalog(
            catalog_id=catalog_id, catalog_entry_id=catalog_entry_id
        )
        db_session.add(catalog_entry_catalog)
        db_session.commit()


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
        db_session.add(catalog_entry)
        db_session.commit()

        return catalog_entry
    except Exception:
        return None


def find_or_create(json):
    try:
        if "job_id" not in json:
            return None
        catalog_entry = find_by_job_id(json["job_id"])
        if catalog_entry == None:
            catalog_entry = create(json)
        return catalog_entry
    except Exception as e:
        logging.service_exception("CatalogEntry", "find_or_create", e)
        return None


def find_by_job_id(job_id):
    job_id = validationUtils.validate_text(job_id)
    job_id = encryption.encrypt_searchable_data(job_id)
    return db_session.scalar(select(CatalogEntry).where(CatalogEntry.job_id == job_id))


def find_by_id(catalog_entry_id):
    try:
        validated_catalog_entry_upload_id = CatalogEntryValidators.validate_id(
            catalog_entry_id
        )
        return db_session.query(CatalogEntry).get(validated_catalog_entry_upload_id)
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
        catalog_entry_catalog = (
            db_session.query(CatalogEntryCatalog)
            .filter_by(catalog_id=catalog.id, catalog_entry_id=catalog_entry.id)
            .first()
        )

        if not catalog.user_has_access(user) or catalog_entry_catalog == None:
            return None

        return catalog_entry
    except Exception:
        return None


def external_entries(catalog_id, upload_server_api_key):
    try:
        if upload_server_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        catalog = CatalogServices.find_by_id(catalog_id)
        if catalog == None:
            return []
        return catalog.entries()
    except Exception:
        return []


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
