from __future__ import absolute_import
import json, glob, logging
import os.path as osp
import collections
from utils import lock
from ..python.api.services import CatalogEntryServices as CatalogEntryServices


def create_catalog_entry(json):
    catalog_entry_json = json.copy()
    catalog_entry_json["processed_utc"] = catalog_entry_json.get("processed_utc", None)
    catalog_entry_json["run_utc"] = catalog_entry_json.get("run_utc", None)
    catalog_entry_json["kml_url"] = catalog_entry_json.get("kml_url", None)
    catalog_entry_json["kml_size"] = catalog_entry_json.get("kml_size", None)
    catalog_entry_json["zip_url"] = catalog_entry_json.get("zip_url", None)
    catalog_entry_json["zip_size"] = catalog_entry_json.get("zip_size", None)
    catalog_entry_json["uploader_id"] = 0
    if " FM" in json["job_id"]:
        catalog_entry_json["entry_type"] = "fuel-moisture"
    elif "Lidar" in json["job_id"]:
        catalog_entry_json["entry_type"] = "lidar"
    else:
        catalog_entry_json["entry_type"] = "fire"

    catalog_entry_json["catalog_id"] = 1

    catalog_entry = CatalogEntryServices.find_or_create(catalog_entry_json)
    return catalog_entry


logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

root = osp.abspath("fdds/simulations")
files = glob.glob(osp.join(root, "*/catalog.json"))
catalog_path = osp.join(root, "catalog.json")
lock_path = catalog_path + ".lock"

catalog = {}
for f in files:
    try:
        f_json = json.load(open(f))
    except:
        logging.error("loading file %s failed, ignoring" % f)
    catalog.update(f_json)

# add blank fields if not present
for i in catalog:
    catalog[i]["processed_utc"] = catalog[i].get("processed_utc", None)
    catalog[i]["run_utc"] = catalog[i].get("run_utc", None)
    catalog[i]["kml_url"] = catalog[i].get("kml_url", None)
    catalog[i]["kml_size"] = catalog[i].get("kml_size", None)
    catalog[i]["zip_url"] = catalog[i].get("zip_url", None)
    catalog[i]["zip_size"] = catalog[i].get("zip_size", None)
    catalog[i]["job_id"] = i
    try:
        catalog_entry = create_catalog_entry(catalog[i])
        if catalog_entry == None:
            logging.info("Failed to create CatalogEntry for %s", i)
    except:
        logging.info("Failed to create CatalogEntry for %s", i)


catalog_sorted = collections.OrderedDict(sorted(list(catalog.items()), reverse=True))

l = lock(lock_path)
l.acquire()
json.dump(catalog_sorted, open(catalog_path, "w"), indent=1, separators=(",", ":"))
l.release()


logging.info("Created catalog at %s", catalog_path)
