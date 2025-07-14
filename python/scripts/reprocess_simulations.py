from scripts.scriptKeys import SIMULATIONS_FOLDER, ADMIN_SERVICES_API_KEY
import api.services.CatalogEntryServices as CatalogEntryServices
import scripts.utils as script_utils

import json
import os.path as osp
import sys


class CatalogEntryCreationError(Exception):
    pass


def unpack_simulation(simulation_path, entry_type, catalog_id):
    catalog_file = osp.join(SIMULATIONS_FOLDER, f"{simulation_path}/catalog.json")
    try:
        catalog_entry_jsons = json.load(open(catalog_file))
        catalog_entry = script_utils.create_catalog_entries(
            catalog_entry_jsons, entry_type
        )
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
        print(f"Adding ${catalog_entry} to Catalog {catalog_id}")
        CatalogEntryServices.create_catalog_entry_catalog(catalog_id, catalog_entry.id)
        print(f"Added ${catalog_entry} to Catalog {catalog_id}")
    except Exception as e:
        print(f"Unpacking simulation failed {e}")
        return


def load_manifest(simulation_path, catalog_entry):
    try:
        manifest_filename = catalog_entry.manifest_filename().split("/")[1]
        manifest_path = osp.join(
            SIMULATIONS_FOLDER, f"{simulation_path}/{manifest_filename}"
        )
        manifest_json = json.load(open(manifest_path))
        return manifest_json
    except Exception as e:
        print(e)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Please provide a simulation_path, entry_type, and catalog_id")
    else:
        unpack_simulation(sys.argv[1], sys.argv[2], int(sys.argv[3]))
