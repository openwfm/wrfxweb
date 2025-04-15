from api.services import AdminServices as AdminServices
from api.serializers import CatalogAccessSerializer as CatalogAccessSerializer
from api.validators.utils import sanitize_text
import api.encryption as encryption


def serialize_catalog_entry(entry):
    return {
        "id": f"{entry.id}",
        "entry_type": sanitize_text(entry.entry_type),
        "from_utc": sanitize_text(entry.from_utc),
        "to_utc": sanitize_text(entry.to_utc),
        "description": sanitize_text(
            encryption.decrypt_searchable_data(entry.description)
        ),
        "manifest_path": sanitize_text(
            encryption.decrypt_searchable_data(entry.manifest_path)
        ),
        "job_id": sanitize_text(encryption.decrypt_searchable_data(entry.job_id)),
        "zip_size": f"{entry.zip_size}",
        "kml_size": f"{entry.kml_size}",
        "processed_utc": sanitize_text(entry.processed_utc),
        "run_utc": sanitize_text(entry.run_utc),
        "zip_url": sanitize_text(encryption.decrypt_searchable_data(entry.zip_url)),
        "kml_url": sanitize_text(encryption.decrypt_searchable_data(entry.kml_url)),
    }


def serialize_catalog_entries(entries):
    return [serialize_catalog_entry(entry) for entry in entries]


def serialize_catalog_entry_with_uploader_id(
    entry, current_user, admin_services_api_key
):
    serialized_catalog_entry = serialize_catalog_entry(entry)
    if not AdminServices.isAdmin(current_user, admin_services_api_key):
        return serialized_catalog_entry
    serialized_catalog_entry["uploader_id"] = entry.catalog_id
    return serialized_catalog_entry


def serialize_catalog_entries_with_uploader_id(
    entries, current_user, admin_services_api_key
):
    return [
        serialize_catalog_entry_with_uploader_id(
            entry, current_user, admin_services_api_key
        )
        for entry in entries
    ]


def serialize_catalog_entry_with_catalogs(entry, current_user, admin_services_api_key):
    serialized_catalog_entry = serialize_catalog_entry(entry)
    if not AdminServices.isAdmin(current_user, admin_services_api_key):
        return serialized_catalog_entry
    serialized_catalog_entry["catalogs"] = serialize_catalogs_without_entries(
        entry.catalogs(), current_user, admin_services_api_key
    )
    return serialized_catalog_entry


def serialize_catalog_entries_with_catalogs(
    entries, current_user, admin_services_api_key
):
    return [
        serialize_catalog_entry_with_catalogs(
            entry, current_user, admin_services_api_key
        )
        for entry in entries
    ]


def serialize_catalog_without_entries(catalog, user, admin_services_api_key):
    if catalog == None:
        return {}
    if not AdminServices.isAdmin(user, admin_services_api_key):
        return {
            "id": catalog.id,
            "description": catalog.description,
            "name": catalog.name,
            "date_created": catalog.date_created,
        }

    return {
        "id": catalog.id,
        "description": catalog.description,
        "name": catalog.name,
        "public": catalog.public,
        "date_created": catalog.date_created,
        "permissions": CatalogAccessSerializer.serialize_accesses(
            catalog.permissions(), user, admin_services_api_key
        ),
    }


def serialize_catalogs_without_entries(catalogs, user, admin_services_api_key):
    return [
        serialize_catalog_without_entries(catalog, user, admin_services_api_key)
        for catalog in catalogs
    ]
