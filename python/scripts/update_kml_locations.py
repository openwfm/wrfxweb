from scripts.scriptKeys import (
    SIMULATIONS_FOLDER,
    CATALOG_FILENAME,
    WRFXWEB_SIMULATIONS_URL,
)

from pathlib import Path
import posixpath as pxp
import os
import json


def update_kml_locations():
    sim_dir = Path(SIMULATIONS_FOLDER)
    for sim in sim_dir.iterdir():
        if sim.is_dir():
            sim_name = sim.name
            print(f"Updating kml path for {sim_name}")
            update_kml_location(sim_name)


def update_kml_location(sim_name):
    try:
        sim_path = os.path.join(SIMULATIONS_FOLDER, sim_name)
        cat_path = os.path.join(sim_path, CATALOG_FILENAME)
        cat = json.load(open(cat_path))
        if "kml_url" in cat[sim_name]:
            kml_filename = parse_kml_url(cat[sim_name]["kml_url"])
            kml_url = pxp.join(WRFXWEB_SIMULATIONS_URL, sim_name, kml_filename)
            cat[sim_name]["kml_url"] = kml_url
            json.dump(cat, open(cat_path, "w"), indent=4, separators=(",", ": "))
    except Exception as e:
        print(f"Error encountered updating kml location for {sim_name}: {e}")


def parse_kml_url(kml_url):
    return os.path.basename(kml_url)


if __name__ == "__main__":
    update_kml_locations()
