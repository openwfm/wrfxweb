def serialize_entries(entries):
    return [serialize_entry(entry) for entry in entries]


def serialize_entry(entry):
    return {
        entry.id,
        entry.catalog_id,
        entry.name,
        entry.zip_size,
        entry.description,
        entry.to_utc,
        entry.kml_size,
        entry.from_utc,
        entry.processed_utc,
        entry.manifest_path,
        entry.run_utc,
        entry.zip_url,
        entry.kml_url,
        entry.job_id,
    }
