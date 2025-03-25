from uploadWorker.app import app
from uploadWorker.logging import utils as loggingUtils
from uploadWorker.workerKeys import (
    TEMP_FOLDER,
    SIMULATIONS_FOLDER,
    UPLOAD_WORKER_API_KEY,
)

import api.services.CatalogEntryServices as CatalogEntryServices
import api.services.UploadToCatalogServices as UploadToCatalogServices
import api.services.CatalogEntryCatalogServices as CatalogEntryCatalogServices

import json
import os.path as osp


import zipfile
import shutil

import os

UPLOAD_EXTENSIONS = [".json", ".png", ".kmz"]


def unpack_catalog_entry_upload(catalog_entry_upload):
    try:
        unzip_catalog_entry_upload(catalog_entry_upload)
    except Exception as e:
        loggingUtils.log_unpacking_error(e)
        return

    try:
        catalog_entry_jsons = load_json(catalog_entry_upload)
        catalog_entry = create_catalog_entries(
            catalog_entry_jsons, catalog_entry_upload
        )
        update_catalog_entry_catalogs(catalog_entry, catalog_entry_upload)
        move_simulation(catalog_entry_upload)
        catalog_entry_upload.process()
    except Exception as e:
        remove_temp_directory()
        loggingUtils.log_unpacking_error(e)


class UploadUnzippingError(Exception):
    def __init__(self, catalog_entry_upload):
        message = f"Error Unzipping CatalogUpload: catalog_entry_upload_id: {catalog_entry_upload.id}"
        super().__init__(message)


def unzip_catalog_entry_upload(catalog_entry_upload):
    try:
        upload_path = catalog_entry_upload.upload_path()
        with zipfile.ZipFile(upload_path, "r") as zip_ref:
            zip_ref.testzip()
            # for file_name in zip_ref.namelist():
            #     file_ext = os.path.splitext(file_name)[1]
            #     if file_ext not in UPLOAD_EXTENSIONS:
            #         return False
            zip_ref.extractall(TEMP_FOLDER)
    except Exception:
        raise UploadUnzippingError(catalog_entry_upload)


class JsonLoadingError(Exception):
    def __init__(self, catalog_entry_upload):
        message = f"Error loading catalog json: catalog_entry_upload_id: {catalog_entry_upload.id}"
        super().__init__(message)


def load_json(catalog_entry_upload):
    directory = os.listdir(TEMP_FOLDER)[0]
    catalog_file = osp.join(TEMP_FOLDER, f"{directory}/catalog.json")
    try:
        catalog_entry_jsons = json.load(open(catalog_file))
        return catalog_entry_jsons
    except Exception:
        raise JsonLoadingError(catalog_entry_upload)


def update_catalog_entry_catalogs(catalog_entry, catalog_entry_upload):
    upload_to_catalogs = UploadToCatalogServices.find_by_catalog_entry_upload_id(
        catalog_entry_upload.id, UPLOAD_WORKER_API_KEY
    )
    for upload_to_catalog in upload_to_catalogs:
        create_json = {
            "catalog_id": upload_to_catalog.catalog_id,
            "catalog_entry_id": catalog_entry.id,
        }
        CatalogEntryCatalogServices.find_or_create(create_json, UPLOAD_WORKER_API_KEY)


class CatalogEntryCreationError(Exception):
    def __init__(self, catalog_entry_upload):
        message = f"Error creating CatalogEntry for Upload: catalog_entry_upload_id: {catalog_entry_upload.id}"
        super().__init__(message)


def create_catalog_entries(catalog_entry_jsons, catalog_entry_upload):
    try:
        for job_id in catalog_entry_jsons:
            catalog_entry_json = catalog_entry_jsons[job_id]
            catalog_entry_json["processed_utc"] = catalog_entry_jsons[job_id].get(
                "processed_utc", None
            )
            catalog_entry_json["run_utc"] = catalog_entry_jsons[job_id].get(
                "run_utc", None
            )
            catalog_entry_json["kml_url"] = catalog_entry_jsons[job_id].get(
                "kml_url", None
            )
            catalog_entry_json["kml_size"] = catalog_entry_jsons[job_id].get(
                "kml_size", None
            )
            catalog_entry_json["zip_url"] = catalog_entry_jsons[job_id].get(
                "zip_url", None
            )
            catalog_entry_json["zip_size"] = catalog_entry_jsons[job_id].get(
                "zip_size", None
            )
            catalog_entry_json["job_id"] = job_id
            catalog_entry_json["uploader_id"] = catalog_entry_upload.uploader_id
            catalog_entry_json["entry_type"] = catalog_entry_upload.entry_type

            catalog_entry = CatalogEntryServices.find_or_create(catalog_entry_json)
            if catalog_entry == None:
                loggingUtils.log_catalog_entry_fail(catalog_entry_upload, job_id)
                raise CatalogEntryCreationError(catalog_entry_upload)
            else:
                loggingUtils.log_catalog_entry(catalog_entry_upload, catalog_entry)
                return catalog_entry
    except Exception:
        raise CatalogEntryCreationError(catalog_entry_upload)


def move_simulation(catalog_entry_upload):
    upload_path = catalog_entry_upload.upload_path()
    directory = os.listdir(TEMP_FOLDER)[0]
    temp_source = f"{TEMP_FOLDER}/{directory}"
    destination = f"{SIMULATIONS_FOLDER}/{directory}"
    if os.path.exists(destination):
        merge_folders(temp_source, destination)
    else:
        shutil.move(temp_source, destination)
    os.remove(upload_path)


def merge_folders(source_folder, dest_folder):
    shutil.rmtree(source_folder)


def remove_temp_directory():
    directory = os.listdir(TEMP_FOLDER)[0]
    temp_source = f"{TEMP_FOLDER}/{directory}"
    shutil.rmtree(temp_source)
