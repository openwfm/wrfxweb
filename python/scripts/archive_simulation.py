from scriptKeys import (
    SIMULATIONS_FOLDER,
)

from datetime import datetime
import html
import os
import json
import sys


def archive_simulation(job_id, days_to_archive, simulation_days, dry_run=1):
    if days_to_archive < simulation_days:
        print("days_to_archive must be greater than or equal to the simulations_days")
        return
    try:
        manifest_json = process_job_manifest(
            job_id, days_to_archive, simulation_days, dry_run
        )
        catalog_json = process_catalog(job_id, manifest_json, dry_run)
        manifest_path = job_manifest_path(job_id, dry_run)
        catalog_path = job_catalog_path(job_id, dry_run)
        if not dry_run:
            if os.path.exists(manifest_path):
                archive_manifest_path = archive_job_manifest_path(job_id)
                os.rename(manifest_path, archive_manifest_path)
            if os.path.exists(catalog_path):
                archive_catalog_path = archive_job_catalog_path(job_id)
                os.rename(catalog_path, archive_catalog_path)
        with open(manifest_path, "w") as file:
            json.dump(manifest_json, file, indent=4)
        with open(catalog_path, "w") as file:
            json.dump(catalog_json, file, indent=4)
    except Exception as e:
        print(f"Error in recreate_manifest: {e}")
        return


def process_job_manifest(job_id, days_to_archive, simulation_days, dry_run):
    manifest_json = load_manifest(job_id)
    new_manifest = {}
    archive_count = 0
    delete_count = 0
    simulation_timestamp_count = 0
    for domain in manifest_json:
        domain_json = manifest_json[domain]
        for timestamp in domain_json:
            timestamp_json = domain_json[timestamp]
            for layer_type in timestamp_json:
                layer_json = timestamp_json[layer_type]
                if timestamp_age_in_days(timestamp) > days_to_archive:
                    if dry_run:
                        delete_count += 1
                    else:
                        delete_timestamp_urls(job_id, layer_json)
                elif timestamp_age_in_days(timestamp) <= simulation_days:
                    simulation_timestamp_count += 1
                    new_domain_json = inner_manifest(new_manifest, domain)
                    new_timestamp_json = inner_manifest(new_domain_json, timestamp)
                    new_layer_json = inner_manifest(new_timestamp_json, layer_type)

                    new_layer_json["raster"] = sanitize_text(layer_json["raster"])
                    new_layer_json["coords"] = layer_json["coords"]
                    if "colorbar" in layer_json:
                        new_layer_json["levels"] = layer_json["levels"]
                        new_layer_json["colorbar"] = layer_json["colorbar"]
                    if "kml" in layer_json:
                        new_layer_json["kml"] = sanitize_text(layer_json["kml"])
                else:
                    archive_count += 1
    if dry_run:
        print(
            f"Will preserve {simulation_timestamp_count} timestamp urls, archive {archive_count} timestamp urls, and delete {delete_count} timestamp urls"
        )
    return new_manifest


def process_catalog(job_id, manifest_json, dry_run):
    catalog_json = load_catalog(job_id)
    from_utc = ""
    to_utc = ""
    for domain in manifest_json:
        domain_json = manifest_json[domain]
        for timestamp in domain_json:
            from_utc = min_timestamp(from_utc, timestamp)
            to_utc = max_timestamp(to_utc, timestamp)
    catalog_job_json = catalog_json[job_id]
    catalog_job_json["from_utc"] = from_utc
    catalog_job_json["to_utc"] = to_utc
    if dry_run:
        print(f"Updating catalog.json from_utc: {from_utc}, to_utc: {to_utc}")

    return catalog_json


def job_manifest_path(job_id, dry_run):
    if dry_run:
        manifest_filename = f"{job_id}_dry_run.json"
    else:
        manifest_filename = f"{job_id}.json"
    manifest_path = os.path.join(SIMULATIONS_FOLDER, job_id, manifest_filename)
    return manifest_path


def job_catalog_path(job_id, dry_run):
    if dry_run:
        catalog_filename = f"catalog_dry_run.json"
    else:
        catalog_filename = f"catalog.json"
    catalog_path = os.path.join(SIMULATIONS_FOLDER, job_id, catalog_filename)
    return catalog_path


def archive_job_manifest_path(job_id):
    date = datetime.now().strftime("%Y%m%d")
    manifest_filename = f"{job_id}_{date}.json"
    manifest_path = os.path.join(SIMULATIONS_FOLDER, job_id, manifest_filename)
    return manifest_path


def archive_job_catalog_path(job_id):
    date = datetime.now().strftime("%Y%m%d")
    catalog_filename = f"catalog_{date}.json"
    catalog_path = os.path.join(SIMULATIONS_FOLDER, job_id, catalog_filename)
    return catalog_path


def load_manifest(job_id):
    manifest_path = job_manifest_path(job_id, 0)
    try:
        manifest_json = json.load(open(manifest_path))
        return manifest_json
    except Exception as e:
        print(f"Problem loading manifest at {manifest_path}: {e}")
        return {}


def load_catalog(job_id):
    catalog_path = job_catalog_path(job_id, 0)
    try:
        catalog_json = json.load(open(catalog_path))
        return catalog_json
    except Exception as e:
        print(f"Problem loading manifest at {catalog_path}: {e}")
        return {}


def timestamp_age_in_days(timestamp):
    date_format = "%Y-%m-%d_%H:%M:%S"
    datetime_timestamp = datetime.strptime(timestamp, date_format)
    return (datetime.now() - datetime_timestamp).days


def min_timestamp(timestamp_1, timestamp_2):
    if timestamp_1 == "":
        return timestamp_2
    if timestamp_2 == "":
        return timestamp_1

    date_format = "%Y-%m-%d_%H:%M:%S"
    timestamp_1_datetime = datetime.strptime(timestamp_1, date_format)
    timestamp_2_datetime = datetime.strptime(timestamp_2, date_format)
    if timestamp_1_datetime < timestamp_2_datetime:
        return timestamp_1
    return timestamp_2


def max_timestamp(timestamp_1, timestamp_2):
    if timestamp_1 == "":
        return timestamp_2
    if timestamp_2 == "":
        return timestamp_1

    date_format = "%Y-%m-%d_%H:%M:%S"
    timestamp_1_datetime = datetime.strptime(timestamp_1, date_format)
    timestamp_2_datetime = datetime.strptime(timestamp_2, date_format)
    if timestamp_1_datetime > timestamp_2_datetime:
        return timestamp_1
    return timestamp_2


def delete_timestamp_urls(job_id, layer_json):
    delete_url(job_id, layer_json["raster"])
    if "colorbar" in layer_json:
        delete_url(job_id, layer_json["colorbar"])
    if "kml" in layer_json:
        delete_url(job_id, layer_json["kml"])


def inner_manifest(manifest, key):
    key = sanitize_text(key)
    if key in manifest:
        return manifest[key]
    inner_manifest = {}
    manifest[key] = inner_manifest
    return inner_manifest


def sanitize_text(text_input):
    return html.escape(text_input)


def delete_url(job_id, url_to_delete):
    simulation_path = job_simulation_path(job_id)
    url_full_path = os.path.join(simulation_path, url_to_delete)
    if os.path.exists(url_full_path):
        os.remove(url_full_path)


def job_simulation_path(job_id):
    simulation_path = os.path.join(SIMULATIONS_FOLDER, job_id)
    return simulation_path


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(
            "Please provide a job_id, days_to_archive, simulation_days to keep, and dry_run boolean of a simulation to archive"
        )
    else:
        if sys.argv[3] == "0":
            archive_simulation(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), 0)
        else:
            archive_simulation(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), 1)
