import api.services.CatalogEntryServices as CatalogEntryServices
import api.services.CatalogEntryCatalogServices as CatalogEntryCatalogServices


def add_entry_to_catalog(simulation_path, catalog_id):
    catalog_entry = CatalogEntryServices.find_by_job_id(simulation_path)
    if catalog_entry == None:
        print(f"no CatalogEntry for job_id {simulation_path}")
        return
    create_json = {"catalog_id": catalog_id, "catalog_entry_id": catalog_entry.id}
    catalog_entry_catalog = CatalogEntryCatalogServices.create(create_json)
    if catalog_entry_catalog == None:
        print(
            f"CatalogEntryCatalog could not be created for job_id {simulation_path} and catalog_id {catalog_id}"
        )
    else:
        print(f"<CatalogEntryCatalog {catalog_entry_catalog.id}> created")
