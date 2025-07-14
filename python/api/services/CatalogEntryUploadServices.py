from api.session import db_session
import api.encryption as encryption
from api.models.catalogEntryUpload.CatalogEntryUpload import CatalogEntryUpload
from api.validators import (
    CatalogEntryUploadValidators as CatalogEntryUploadValidators,
    utils as validationUtils,
)
from api.services import (
    CatalogEntryCatalogServices as CatalogEntryCatalogServices,
    CatalogEntryServices as CatalogEntryServices,
    UploadToCatalogServices,
)
from api.apiKeys import UPLOAD_API_KEYS, TEMP_FOLDER

import api.logging.utils as logging
import datetime
import json
import os
import zipfile
import shutil


# catalog_entry_upload_params {
#        "catalog": catalog,
#        "zip_file": zip_file,
#        "uploader_id": current_user.id,
#        "entry_type": entry_type,
#    }
def create(json, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        catalog_entry_upload_params = CatalogEntryUploadValidators.validate_create_json(
            json
        )

        zip_file = catalog_entry_upload_params["zip_file"]
        zip_filename = validationUtils.validate_filename(zip_file.filename)
        encrypted_filename = encryption.encrypt_searchable_data(zip_filename)

        catalog_entry_upload = CatalogEntryUpload(
            uploader_id=catalog_entry_upload_params["uploader_id"],
            entry_type=catalog_entry_upload_params["entry_type"],
            zip_filename=encrypted_filename,
            uploaded_timestamp=str(datetime.datetime.now()),
        )

        db_session.add(catalog_entry_upload)
        db_session.commit()

        zip_file.save(catalog_entry_upload.upload_path())

        return catalog_entry_upload
    except Exception as e:
        logging.service_exception("CatalogEntryUpload", "create", e)
        return None


def find_by_id(catalog_entry_upload_id):
    try:
        validated_catalog_entry_upload_id = CatalogEntryUploadValidators.validate_id(
            catalog_entry_upload_id
        )
        return db_session.query(CatalogEntryUpload).get(
            validated_catalog_entry_upload_id
        )
    except Exception as e:
        logging.service_exception("CatalogEntryUpload", "find", e)
        return None


def update_catalog_entry_catalogs(
    catalog_entry_id, catalog_entry_upload_id, upload_api_key
):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        upload_to_catalogs = UploadToCatalogServices.find_by_catalog_entry_upload_id(
            catalog_entry_upload_id, upload_api_key
        )
        for upload_to_catalog in upload_to_catalogs:
            create_json = {
                "catalog_id": upload_to_catalog.catalog_id,
                "catalog_entry_id": catalog_entry_id,
            }
            CatalogEntryCatalogServices.find_or_create(create_json, upload_api_key)
    except Exception as e:
        logging.service_exception(
            "CatalogEntryUpload", "update_catalog_entry_catalogs", e
        )
        return []


def unpack_by_id(catalog_entry_upload_id, upload_api_key):
    if upload_api_key not in UPLOAD_API_KEYS:
        logging.service_exception(
            "CatalogEntryUpload", "unpack_by_id", "Invalid UploadApiKey"
        )
        return
    try:
        catalog_entry_upload = find_by_id(catalog_entry_upload_id)
        unzip(catalog_entry_upload, upload_api_key)
    except Exception as e:
        logging.service_exception("CatalogEntryUpload", "unpack_by_id", e)
        return
    try:
        catalog_entry_jsons = load_json(catalog_entry_upload)
        catalog_entry = create_catalog_entries(
            catalog_entry_jsons, catalog_entry_upload
        )
        # update_catalog_entry_catalogs(catalog_entry, catalog_entry_upload)
        move_simulation(catalog_entry_upload, catalog_entry)
        catalog_entry_upload.process()
        return catalog_entry
    except Exception as e:
        remove_temp_directory()
        logging.service_exception("CatalogEntryUpload", "unpack_by_id", e)
        return None


class UploadUnzippingError(Exception):
    def __init__(self, catalog_entry_upload):
        message = f"Error Unzipping CatalogUpload: catalog_entry_upload_id: {catalog_entry_upload.id}"
        super().__init__(message)


def unzip(catalog_entry_upload, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        upload_path = catalog_entry_upload.upload_path()
        with zipfile.ZipFile(upload_path, "r") as zip_ref:
            zip_ref.testzip()
            # for later, more extensive zip testing
            # for file_name in zip_ref.namelist():
            #     file_ext = os.path.splitext(file_name)[1]
            #     if file_ext not in UPLOAD_EXTENSIONS:
            #         return False

            unzip_directory = catalog_entry_upload.unzip_directory()
            zip_ref.extractall(unzip_directory)

            # zip was extracted into another folder. need to extract it
            if len(os.listdir(unzip_directory)) == 1:
                directory = os.listdir(unzip_directory)[0]
                source = f"{unzip_directory}/{directory}"
                shutil.move(source, TEMP_FOLDER)
                shutil.rmtree(unzip_directory)
                shutil.move(f"{TEMP_FOLDER}/{directory}", unzip_directory)
    except Exception:
        raise UploadUnzippingError(catalog_entry_upload)


class JsonLoadingError(Exception):
    def __init__(self, catalog_entry_upload):
        message = f"Error loading catalog json: catalog_entry_upload_id: {catalog_entry_upload.id}"
        super().__init__(message)


def load_json(catalog_entry_upload):
    catalog_file = catalog_entry_upload.unzipped_catalog()
    try:
        catalog_entry_jsons = json.load(open(catalog_file))
        return catalog_entry_jsons
    except Exception:
        raise JsonLoadingError(catalog_entry_upload)


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
                raise CatalogEntryCreationError(catalog_entry_upload)
            else:
                return catalog_entry
    except Exception:
        raise CatalogEntryCreationError(catalog_entry_upload)


def move_simulation(catalog_entry_upload, catalog_entry):
    upload_path = catalog_entry_upload.upload_path()
    temp_source = catalog_entry_upload.unzip_directory()
    destination = catalog_entry.entry_directory()
    if os.path.exists(destination):
        merge_folders(temp_source, destination)
    else:
        shutil.move(temp_source, destination)
    os.remove(upload_path)


def merge_folders(source_folder, dest_folder):
    for item in os.listdir(source_folder):
        source_item_path = os.path.join(source_folder, item)
        destination_item_path = os.path.join(dest_folder, item)
        if os.path.exists(destination_item_path):
            os.remove(destination_item_path)
        shutil.move(source_item_path, destination_item_path)
    shutil.rmtree(source_folder)


def remove_temp_directory():
    directory = os.listdir(TEMP_FOLDER)[0]
    temp_source = f"{TEMP_FOLDER}/{directory}"
    shutil.rmtree(temp_source)
