from api.services import AdminServices as AdminServices
from api.validators.utils import sanitize_text


def serialize_catalog_entry(entry):
    return {
        "id": f"{entry.id}",
        "catalog_id": sanitize_text(f"{entry.catalog_id}"),
        "entry_type": sanitize_text(entry.entry_type),
        "from_utc": sanitize_text(entry.from_utc),
        "to_utc": sanitize_text(entry.to_utc),
        "description": sanitize_text(entry.description),
        "manifest_path": sanitize_text(entry.manifest_path),
        "job_id": sanitize_text(entry.job_id),
        "zip_size": sanitize_text(entry.zip_size),
        "kml_size": sanitize_text(entry.kml_size),
        "processed_utc": sanitize_text(entry.processed_utc),
        "run_utc": sanitize_text(entry.run_utc),
        "zip_url": sanitize_text(entry.zip_url),
        "kml_url": sanitize_text(entry.kml_url),
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
