from api.session import db_session
from api.models.catalogEntry.CatalogEntry import CatalogEntry
from api.models.catalogEntryCatalog.CatalogEntryCatalog import CatalogEntryCatalog
from api.services import (
    CatalogServices as CatalogServices,
    AdminServices as AdminServices,
    SimLayerServices as SimLayerServices,
    LayerTimestampServices as LayerTimestampServices,
)
from api.validators import (
    CatalogEntryValidators as CatalogEntryValidators,
    CatalogValidators as CatalogValidators,
    utils as validationUtils,
)
from api.apiKeys import CLIENT_SERVER_API_KEYS, UPLOAD_API_KEYS, ADMIN_SERVICES_API_KEY
import api.logging.utils as logging
import api.encryption as encryption

from sqlalchemy import select
import json
import os


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


def mark_id_for_deletion(catalog_entry_id, user, admin_services_api_key):
    try:
        if not AdminServices.isAdmin(user, admin_services_api_key):
            return False
        catalog_entry = find_by_id(catalog_entry_id)
        if catalog_entry == None:
            return False
        catalog_entry.archived = True
        db_session.commit()
        return True
    except Exception as e:
        logging.service_exception("CatalogEntry", "mark_id_for_deletion", e)
        return False


def delete_by_id(catalog_entry_id, admin_services_api_key):
    try:
        if admin_services_api_key != ADMIN_SERVICES_API_KEY:
            return False
        catalog_entry = find_by_id(catalog_entry_id)
        if catalog_entry == None:
            return False
        sim_layers = catalog_entry.sim_layers()
        for sim_layer in sim_layers:
            SimLayerServices.delete(sim_layer, admin_services_api_key)
        catalog_entry.destroy()
        return True
    except Exception as e:
        logging.service_exception("CatalogEntry", "delete_by_id", e)
        return False


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


def delete_stale_timestamps(catalog_entry_id, max_age_in_days, upload_server_api_key):
    try:
        if upload_server_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        catalog_entry = find_by_id(catalog_entry_id)
        if catalog_entry == None:
            return
        timestamps = catalog_entry.layer_timestamps()
        stale_timestamps = [
            timestamp
            for timestamp in timestamps
            if timestamp.age_in_days() > int(max_age_in_days)
        ]
        for timestamp in stale_timestamps:
            LayerTimestampServices.delete(timestamp, upload_server_api_key)

    except Exception as e:
        print(e)
        logging.service_exception("CatalogEntry", "delete_stale_timestamps", e)
        return


def recreate_manifest(catalog_entry_id, upload_server_api_key):
    try:
        if upload_server_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        catalog_entry = find_by_id(catalog_entry_id)
        if catalog_entry == None:
            return
        manifest_json = serialize_catalog_entry_manifest(catalog_entry)
        manifest_path = catalog_entry.web_manifest_path()
        if os.path.exists(manifest_path):
            os.remove(manifest_path)
        with open(manifest_path, "w") as file:
            json.dump(manifest_json, file, indent=4)
    except Exception as e:
        logging.service_exception("CatalogEntry", "recreate_mainfest", e)
        return


def inner_manifest(manifest, key):
    if key in manifest:
        return manifest[key]
    inner_manifest = {}
    manifest[key] = inner_manifest
    return inner_manifest


def serialize_catalog_entry_manifest(catalog_entry):
    entry_manifest = {}
    for sim_layer in catalog_entry.sim_layers():
        domain = validationUtils.sanitize_text(f"{sim_layer.domain}")
        layer_type = validationUtils.sanitize_text(sim_layer.layer_type.name)
        domain_manifest = inner_manifest(entry_manifest, domain)
        for layer_timestamp in sim_layer.layer_timestamps():
            timestamp = validationUtils.sanitize_text(layer_timestamp.timestamp)
            timestamp_json = inner_manifest(domain_manifest, timestamp)
            layer_json = inner_manifest(timestamp_json, layer_type)

            layer_json["kml"] = validationUtils.sanitize_text(layer_timestamp.kml_url())
            layer_json["raster"] = validationUtils.sanitize_text(
                layer_timestamp.png_url()
            )
            layer_json["coords"] = [
                [coord.latitude, coord.longitude] for coord in layer_timestamp.coords()
            ]

            colorbar = layer_timestamp.colorbar()
            if colorbar != None:
                layer_json["levels"] = [level.value for level in colorbar.levels()]
                layer_json["colorbar"] = validationUtils.sanitize_text(
                    colorbar.png_url()
                )

    return entry_manifest


def admin_entries(catalog_id, user, admin_services_api_key):
    catalog = CatalogServices.admin_catalog(user, catalog_id, admin_services_api_key)
    if catalog == None:
        return []
    return catalog.entries()


def admin_all_entries(user, admin_services_api_key):
    if AdminServices.isAdmin(user, admin_services_api_key):
        catalog_entries = db_session.query(CatalogEntry).all()
        return [
            catalog_entry
            for catalog_entry in catalog_entries
            if not catalog_entry.archived
        ]
    return []
