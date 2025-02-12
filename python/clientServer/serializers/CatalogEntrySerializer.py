def serialize_catalog_entries(entries):
    return [serialize_catalog_entry(entry) for entry in entries]


def serialize_catalog_entry(entry):
    return {"id": entry.id, "catalog_id": entry.catalog_id, "name": entry.name}
