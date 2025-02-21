from uploadWorker.app import app
from uploadWorker.logging import utils as loggingUtils
from uploadWorker.workerKeys import TEMP_FOLDER, SIMULATIONS_FOLDER

import api.services.CatalogEntryServices as CatalogEntryServices

import json
import os.path as osp


import zipfile
import shutil

import os

UPLOAD_EXTENSIONS = [".json", ".png", ".kmz"]


def unpack_catalog_entry_upload(catalog_entry_upload):
    upload_path = catalog_entry_upload.upload_path()
    if not unzip_catalog_entry_upload(upload_path):
        loggingUtils.log_unpacking_error(catalog_entry_upload.id, upload_path)
        return
    directory = os.listdir(TEMP_FOLDER)[0]
    catalog_file = osp.join(TEMP_FOLDER, f"{directory}/catalog.json")
    try:
        catalog_entry_jsons = json.load(open(catalog_file))
        create_catalog_entries(catalog_entry_jsons, catalog_entry_upload)
        shutil.move(f"{TEMP_FOLDER}/{directory}", f"{SIMULATIONS_FOLDER}/{directory}")
        os.remove(upload_path)
        catalog_entry_upload.destroy()
    except:
        shutil.rmtree(f"{TEMP_FOLDER}/{directory}")
        loggingUtils.log_unpacking_error(catalog_entry_upload.id, catalog_file)


def unzip_catalog_entry_upload(upload_path):
    try:
        with zipfile.ZipFile(upload_path, "r") as zip_ref:
            zip_ref.testzip()
            # for file_name in zip_ref.namelist():
            #     file_ext = os.path.splitext(file_name)[1]
            #     if file_ext not in UPLOAD_EXTENSIONS:
            #         return False
            zip_ref.extractall(TEMP_FOLDER)
            return True
    except:
        return False


def create_catalog_entries(catalog_entry_jsons, catalog_entry_upload):
    for job_id in catalog_entry_jsons:
        catalog_entry_json = catalog_entry_jsons[job_id]
        catalog_entry_json["processed_utc"] = catalog_entry_jsons[job_id].get(
            "processed_utc", None
        )
        catalog_entry_json["run_utc"] = catalog_entry_jsons[job_id].get("run_utc", None)
        catalog_entry_json["kml_url"] = catalog_entry_jsons[job_id].get("kml_url", None)
        catalog_entry_json["kml_size"] = catalog_entry_jsons[job_id].get(
            "kml_size", None
        )
        catalog_entry_json["zip_url"] = catalog_entry_jsons[job_id].get("zip_url", None)
        catalog_entry_json["zip_size"] = catalog_entry_jsons[job_id].get(
            "zip_size", None
        )
        catalog_entry_json["job_id"] = job_id
        catalog_entry_json["uploader_id"] = catalog_entry_upload["uploader_id"]
        catalog_entry_json["catalog_id"] = catalog_entry_upload["catalog_id"]
        catalog_entry_json["entry_type"] = catalog_entry_upload["entry_type"]

        with app.app_context():
            catalog_entry = CatalogEntryServices.create(catalog_entry_json)
            if catalog_entry == None:
                loggingUtils.log_catalog_entry_fail(catalog_entry_upload, job_id)
            else:
                loggingUtils.log_catalog_entry(catalog_entry_upload, catalog_entry)
