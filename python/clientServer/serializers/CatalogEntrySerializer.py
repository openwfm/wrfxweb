def serialize_catalog_entries(entries):
    return [serialize_catalog_entry(entry) for entry in entries]


def serialize_catalog_entry(entry):
    return {
        "id": entry.id,
        "catalog_id": entry.catalog_id,
        "name": entry.name,
        "zip_size": "",
        "description": "",
        "to_utc": "",
        "kml_size": "",
        "from_utc": "",
        "processed_utc": "",
        "manifest_path": "",
        "run_utc": "",
        "zip_url": "",
        "kml_url": "",
        "job_id": "",
    }
