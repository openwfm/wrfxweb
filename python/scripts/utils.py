import api.services.CatalogEntryServices as CatalogEntryServices


def create_catalog_entries(catalog_entry_jsons, entry_type):
    for job_id in catalog_entry_jsons:
        catalog_entry_json = catalog_entry_jsons[job_id]
        catalog_entry_json["processed_utc"] = catalog_entry_jsons[job_id].get(
            "processed_utc", None
        )
        catalog_entry_json["run_utc"] = catalog_entry_jsons[job_id].get("run_utc", None)

        catalog_entry_json["kml_url"] = catalog_entry_jsons[job_id].get("kml_url", None)
        catalog_entry_json["kml_size"] = catalog_entry_jsons[job_id].get(
            "kml_size", None
        )
        catalog_entry_json["zip_url"] = catalog_entry_jsons[job_id].get("zip_url", None)
        catalog_entry_json["zip_size"] = catalog_entry_jsons[job_id].get(
            "zip_size", None
        )
        catalog_entry_json["job_id"] = job_id
        catalog_entry_json["uploader_id"] = 0
        catalog_entry_json["entry_type"] = entry_type

        catalog_entry = CatalogEntryServices.find_or_create(catalog_entry_json)
        if catalog_entry == None:
            print(f"failed to create CatalogEntry for {job_id}")
            return None
        else:
            print(f"created <CatalogEntry {catalog_entry.id}> for {job_id}")
            return catalog_entry
