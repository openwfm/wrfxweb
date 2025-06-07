from uploadWorker.workerKeys import TEMP_FOLDER, UPLOADS_FOLDER
import uploadWorker.scripts.utils as script_utils
import uploadWorker.threads.thread_utils as thread_utils


import json
import zipfile
import shutil
import os


def unpack_catalog_entry_zip(upload_path, entry_type, catalog_id):
    try:
        unzip_directory = unzip_catalog_entry_upload(upload_path)
    except Exception:
        print(f"{upload_path} was unable to be unzipped")
        return

    try:
        catalog_entry_jsons = load_json(unzip_directory)
        catalog_entry = script_utils.create_catalog_entries(
            catalog_entry_jsons, entry_type
        )
        script_utils.create_catalog_entry_catalog(catalog_entry, catalog_id)
        manifest_json = load_manifest(unzip_directory, catalog_entry)
        thread_utils.create_sim_layer_and_timestamp_records(
            manifest_json, catalog_entry
        )

        move_simulation(upload_path, unzip_directory, catalog_entry)
    except Exception as e:
        shutil.rmtree(unzip_directory)
        print(f"Unpacking CatalogEntry {upload_path} failed: {e}")


def unzip_catalog_entry_upload(upload_path):
    upload_path = f"{UPLOADS_FOLDER}/{upload_path}"
    with zipfile.ZipFile(upload_path, "r") as zip_ref:
        zip_ref.testzip()
        # for later, more extensive zip testing
        # for file_name in zip_ref.namelist():
        #     file_ext = os.path.splitext(file_name)[1]
        #     if file_ext not in UPLOAD_EXTENSIONS:
        #         return False

        unzip_directory = f"{TEMP_FOLDER}/unzipped_catalog_entry"
        zip_ref.extractall(unzip_directory)

        # zip was extracted into another folder. need to extract it
        if len(os.listdir(unzip_directory)) == 1:
            directory = os.listdir(unzip_directory)[0]
            source = f"{unzip_directory}/{directory}"
            shutil.move(source, TEMP_FOLDER)
            shutil.rmtree(unzip_directory)
            shutil.move(f"{TEMP_FOLDER}/{directory}", unzip_directory)
        return unzip_directory


def load_json(unzip_directory):
    catalog_file = f"{unzip_directory}/catalog.json"
    catalog_entry_jsons = json.load(open(catalog_file))
    return catalog_entry_jsons


def load_manifest(unzip_directory, catalog_entry):
    manifest_filename = catalog_entry.manifest_filename().split("/")[1]
    manifest_filepath = f"{unzip_directory}/{manifest_filename}"
    manifest_json = json.load(open(manifest_filepath))
    return manifest_json


def move_simulation(upload_path, unzip_directory, catalog_entry):
    destination = catalog_entry.entry_directory()
    if os.path.exists(destination):
        merge_folders(unzip_directory, destination)
    else:
        shutil.move(unzip_directory, destination)
    os.remove(f"{UPLOADS_FOLDER}/{upload_path}")


def merge_folders(source_folder, dest_folder):
    for item in os.listdir(source_folder):
        source_item_path = os.path.join(source_folder, item)
        destination_item_path = os.path.join(dest_folder, item)
        if os.path.exists(destination_item_path):
            os.remove(destination_item_path)
        shutil.move(source_item_path, destination_item_path)
    shutil.rmtree(source_folder)
