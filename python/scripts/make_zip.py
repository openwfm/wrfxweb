from scripts.scriptKeys import ADMIN_SERVICES_API_KEY
import api.services.CatalogEntryServices as CatalogEntryServices

import sys


def zip_catalog_entry_id(catalog_entry_id):
    try:
        print(f"zipping catalog_entry_id: {catalog_entry_id}")
        catalog_entry = CatalogEntryServices.find_by_id(catalog_entry_id)
        CatalogEntryServices.zip_catalog_entry(catalog_entry_id, ADMIN_SERVICES_API_KEY)
        print(
            f"zipped catalog_entry_id {catalog_entry_id} at {catalog_entry.zip_filepath()}"
        )
    except Exception as e:
        print(f"Encountered an error zipping catalog_entry_id {catalog_entry_id}: {e}")


def zip_simulation(simulation_name):
    catalog_entry = CatalogEntryServices.find_by_job_id(simulation_name)
    if catalog_entry == None:
        print(f"No catalog_entry with name {simulation_name}")
        return
    zip_catalog_entry_id(catalog_entry.id)


def update_zip_meta(simulation_name, zip_url):
    catalog_entry = CatalogEntryServices.find_by_job_id(simulation_name)
    if catalog_entry == None:
        print(f"No catalog_entry with name {simulation_name}")
        return
    CatalogEntryServices.save_zip_for_job_id(catalog_entry.id, zip_url)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Please provide a catalog_entry_id")
    else:
        zip_simulation(sys.argv[1])
