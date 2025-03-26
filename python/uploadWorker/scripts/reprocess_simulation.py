from uploadWorker.workerKeys import SIMULATIONS_FOLDER
import uploadWorker.scripts.utils as script_utils

import json
import os.path as osp


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
    except:
        print(f"loading file {catalog_file} failed ")
        return
