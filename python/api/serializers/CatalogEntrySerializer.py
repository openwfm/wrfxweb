from api.services import AdminServices as AdminServices
from api.serializers import CatalogAccessSerializer as CatalogAccessSerializer
from api.validators.utils import sanitize_text
import api.encryption as encryption


def serialize_catalog_entry(entry):
    return {
        "id": sanitize_text(f"{entry.id}"),
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
        "zip_size": sanitize_text(f"{entry.zip_size}"),
        "kml_size": sanitize_text(f"{entry.kml_size}"),
        "processed_utc": sanitize_text(entry.processed_utc),
        "run_utc": sanitize_text(entry.run_utc),
        "zip_url": sanitize_text(encryption.decrypt_searchable_data(entry.zip_url)),
        "kml_url": sanitize_text(encryption.decrypt_searchable_data(entry.kml_url)),
    }


def inner_manifest(manifest, key):
    if key in manifest:
        return manifest[key]
    inner_manifest = {}
    manifest[key] = inner_manifest
    return inner_manifest


def serialize_catalog_entry_manifest(catalog_entry):
    entry_manifest = {}
    for sim_layer in catalog_entry.sim_layers():
        domain = sanitize_text(f"{sim_layer.domain}")
        layer_type = sanitize_text(sim_layer.layer_type.name)
        domain_manifest = inner_manifest(entry_manifest, domain)
        for layer_timestamp in sim_layer.layer_timestamps():
            timestamp = sanitize_text(layer_timestamp.timestamp)
            timestamp_json = inner_manifest(domain_manifest, timestamp)
            layer_json = inner_manifest(timestamp_json, layer_type)

            layer_json["kml"] = sanitize_text(layer_timestamp.kml_url())
            layer_json["raster"] = sanitize_text(layer_timestamp.png_url())
            layer_json["coords"] = [
                [coord.latitude, coord.longitude] for coord in layer_timestamp.coords()
            ]

            colorbar = layer_timestamp.colorbar()
            if colorbar != None:
                layer_json["levels"] = [level.value for level in colorbar.levels()]
                layer_json["colorbar"] = sanitize_text(colorbar.png_url())

    return entry_manifest


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
            "id": sanitize_text(f"{catalog.id}"),
            "description": sanitize_text(f"{catalog.description}"),
            "name": sanitize_text(f"{catalog.name}"),
            "date_created": sanitize_text(catalog.date_created),
        }

    return {
        "id": sanitize_text(f"{catalog.id}"),
        "description": sanitize_text(f"{catalog.description}"),
        "name": sanitize_text(f"{catalog.name}"),
        "public": sanitize_text(f"{catalog.public}"),
        "date_created": sanitize_text(f"{catalog.date_created}"),
        "permissions": CatalogAccessSerializer.serialize_accesses(
            catalog.permissions(), user, admin_services_api_key
        ),
    }


def serialize_catalogs_without_entries(catalogs, user, admin_services_api_key):
    return [
        serialize_catalog_without_entries(catalog, user, admin_services_api_key)
        for catalog in catalogs
    ]
