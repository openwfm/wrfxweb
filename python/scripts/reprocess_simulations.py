from scripts.scriptKeys import SIMULATIONS_FOLDER, ADMIN_SERVICES_API_KEY
import api.services.CatalogEntryServices as CatalogEntryServices
import api.services.WrfxctrlJobServices as WrfxctrlJobServices
import scripts.utils as script_utils

import json
import os
import sys


class CatalogEntryCreationError(Exception):
    pass


def unpack_simulations(catalog_id):
    try:
        for file_path in os.listdir(SIMULATIONS_FOLDER):
            full_path = os.path.join(SIMULATIONS_FOLDER, file_path)
            if os.path.isdir(full_path):
                catalog_entry = create_catalog_entry(file_path, None)
                if catalog_id != None and catalog_entry != None:
                    add_catalog_entry_to_catalog(catalog_entry, catalog_id)
    except Exception as e:
        print(f"Error unpacking simulations: {e}")
        return


def unpack_simulation(simulation_path, entry_type, catalog_id):
    try:
        catalog_entry = create_catalog_entry(simulation_path, entry_type)
        if catalog_entry == None:
            return
        if catalog_id != None:
            print(f"Adding ${catalog_entry} to Catalog {catalog_id}")
            CatalogEntryServices.create_catalog_entry_catalog(
                catalog_id, catalog_entry.id
            )
            print(f"Added ${catalog_entry} to Catalog {catalog_id}")
        return catalog_entry
    except Exception as e:
        print(f"Unpacking simulation failed {e}")
        return


def link_catalog_entry_to_wrfxctrl_job(catalog_entry):
    try:
        job_id = catalog_entry.job_id
        WrfxctrlJobServices.add_catalog_entry_by_job_id(job_id, catalog_entry.id)
    except Exception as e:
        print(f"Linking CatalogEntry failed {e}")
        return


def add_catalog_entry_to_catalog(catalog_entry, catalog_id):
    try:
        print(f"Adding ${catalog_entry} to Catalog {catalog_id}")
        CatalogEntryServices.create_catalog_entry_catalog(catalog_id, catalog_entry.id)
        print(f"Added ${catalog_entry} to Catalog {catalog_id}")
    except Exception as e:
        print(
            f"Adding catalog_entry {catalog_entry} to catalog {catalog_id} failed: {e}"
        )
        return


def create_catalog_entry(simulation_path, entry_type):
    try:
        catalog_file = os.path.join(
            SIMULATIONS_FOLDER, f"{simulation_path}/catalog.json"
        )
        catalog_entry_jsons = json.load(open(catalog_file))
        catalog_entry = script_utils.create_catalog_entries(
            catalog_entry_jsons, entry_type
        )
        if catalog_entry == None:
            print(f"Couldn't create catalog_entry for simulation {simulation_path}")
            return
        print(f"Processing timestamps for ${catalog_entry}")
        created_layer_timestamps = CatalogEntryServices.process_pngs(
            catalog_entry.id, ADMIN_SERVICES_API_KEY
        )
        print(
            f"{created_layer_timestamps} LayerTimestamps created for ${catalog_entry}"
        )

        print(f"Creating manifest for ${catalog_entry}")
        CatalogEntryServices.recreate_manifest(catalog_entry.id, ADMIN_SERVICES_API_KEY)
        print(f"Created manifest for ${catalog_entry}")
        return catalog_entry
    except Exception as e:
        print(f"Creating CatalogEntry for simulation {simulation_path} failed: {e}")
        return


def load_manifest(simulation_path, catalog_entry):
    try:
        manifest_filename = catalog_entry.manifest_filename().split("/")[1]
        manifest_path = os.path.join(
            SIMULATIONS_FOLDER, f"{simulation_path}/{manifest_filename}"
        )
        manifest_json = json.load(open(manifest_path))
        return manifest_json
    except Exception as e:
        print(e)


if __name__ == "__main__":
    if len(sys.argv) != 3 or len(sys.argv) != 2:
        print(
            "Usage: python process_simulation.py <job_id> <catalog_id> or process_simulation.py <job_id>"
        )
        sys.exit(1)
    job_id = sys.argv[1]
    catalog_id = sys.argv[2] if len(sys.argv) != 3 else None
    unpack_simulation(job_id, None, catalog_id)
