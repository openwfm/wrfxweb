from scripts.scriptKeys import ADMIN_SERVICES_API_KEY
import api.services.CatalogEntryServices as CatalogEntryServices

import sys


def make_kmz(job_id, steps, mode, only_vars):
    try:
        print(f"creating kmz for {job_id}")
        kmz_params = {"steps": steps, "mode": mode, "only_vars": only_vars}
        catalog_entry = CatalogEntryServices.find_by_job_id(job_id)
        if catalog_entry == None:
            print(f"No CatalogEntry found with job_id {job_id}")
            return

        catalog_entry = CatalogEntryServices.kml_catalog_entry(
            catalog_entry.id, kmz_params, ADMIN_SERVICES_API_KEY
        )
        if catalog_entry == None:
            print(f"Kml creation for job_id {job_id} failed")
            return
        print(
            f"created kml for catalog_entry_id {catalog_entry.id} at {catalog_entry.zip_filepath()}"
        )
    except Exception as e:
        print(f"Encountered an error making kml for job_id {job_id}: {e}")


def kml_entry_id(catalog_entry_id, steps, mode, only_vars):
    try:
        print(f"creating kmz for catalog_entry_id {catalog_entry_id}")
        kmz_params = {"steps": steps, "mode": mode, "only_vars": only_vars}
        catalog_entry = CatalogEntryServices.find_by_id(catalog_entry_id)
        if catalog_entry == None:
            print(f"No CatalogEntry found with id {catalog_entry_id}")
            return

        catalog_entry = CatalogEntryServices.kml_catalog_entry(
            catalog_entry.id, kmz_params, ADMIN_SERVICES_API_KEY
        )
        if catalog_entry == None:
            print(f"Kml creation for job_id {job_id} failed")
            return
        print(
            f"created kml for catalog_entry_id {catalog_entry.id} at {catalog_entry.zip_filepath()}"
        )
    except Exception as e:
        print(f"Encountered an error making kml for job_id {job_id}: {e}")


def update_catalog_entry_with_kml(job_id):
    try:
        print(f"updating catalog_entry with job_id {job_id} with kml info.")
        catalog_entry = CatalogEntryServices.find_by_job_id(job_id)
        if catalog_entry == None:
            print(f"No CatalogEntry found with job_id {job_id}")
            return

        CatalogEntryServices.save_kml(catalog_entry)
        print(
            f"updated kml info for catalog_entry_id {catalog_entry.id} at with job_id {job_id}"
        )
    except Exception as e:
        print(f"Encountered an error updating kmli info for job_id {job_id}: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: make_kmz.sh job_id steps mode only_vars variable1 variable2 ...")
        print("job_id: the name of job directory")
        print("steps: '1,1,1,3' takes every 3rd frame in domain 4, etc. Default: all 1")
        print("mode: inc to include image files (default), ref to use links only")
        print(
            "variable (optional): variables to include; if absent all will be included"
        )
        sys.exit(1)

    job_id = sys.argv[1]

    steps = ""
    if len(sys.argv) >= 3:
        steps = sys.argv[2]

    if len(sys.argv) >= 4:
        mode = sys.argv[3]
    else:
        mode = "inc"

    if len(sys.argv) >= 5:
        only_vars = sys.argv[4:]
    else:
        only_vars = None

    make_kmz(job_id, steps, mode, only_vars)
