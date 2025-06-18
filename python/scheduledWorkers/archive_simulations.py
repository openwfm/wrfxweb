from scheduledWorkers.workerKeys import UPLOAD_WORKER_API_KEY
import api.services.CatalogEntryServices as CatalogEntryServices

import sys


def archive_simulation(catalog_entry_id, number_of_days):
    CatalogEntryServices.delete_stale_timestamps(
        catalog_entry_id, number_of_days, UPLOAD_WORKER_API_KEY
    )
    CatalogEntryServices.recreate_manifest(catalog_entry_id, UPLOAD_WORKER_API_KEY)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Please provide a catalog_entry_id and number_of_days to keep")
    else:
        archive_simulation(sys.argv[1], sys.argv[2])
