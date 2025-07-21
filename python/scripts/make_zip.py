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
    zip_simulation(catalog_entry.id)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Please provide a catalog_entry_id")
    else:
        zip_catalog_entry_id(sys.argv[1])
