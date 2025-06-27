from uploadWorker.workerKeys import SIMULATIONS_FOLDER
import uploadWorker.scripts.utils as script_utils
import uploadWorker.threads.thread_utils as thread_utils

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
        script_utils.create_catalog_entry_catalog(catalog_entry, catalog_id)
        print(f"Loading manifest for ${catalog_entry}")
        manifest_json = load_manifest(simulation_path, catalog_entry)
        print(f"manifest loaded for ${catalog_entry}")
        created_layer_timestamps = thread_utils.create_sim_layer_and_timestamp_records(
            manifest_json, catalog_entry
        )
        print(
            f"{created_layer_timestamps} LayerTimestamps created for ${catalog_entry}"
        )

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
