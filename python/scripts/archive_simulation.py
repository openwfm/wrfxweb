from scripts.scriptKeys import (
    SIMULATIONS_FOLDER,
)

from datetime import datetime
import html
import os
import json
import sys


def remove_imgs_not_in_manifest(job_id, dry_run=1):
    try:
        imgs_in_manifest = imgs_in_job_manifest(job_id)
        simulation_path = os.path.join(SIMULATIONS_FOLDER, job_id)
        count = 0
        imgs_to_delete = 0
        with os.scandir(simulation_path) as entries:
            for entry in entries:
                if entry.is_file() and entry.name.lower().endswith("png"):
                    if not entry.name in imgs_in_manifest:
                        imgs_to_delete += 1
                        if dry_run == 0:
                            os.remove(entry.path)
                    count += 1
                    if count % 10000 == 0:
                        print(f"Processed {count} pngs")
        if dry_run == 0:
            print(f"Removed {imgs_to_delete} of {count} total pngs")
        else:
            print(f"{imgs_to_delete} of {count} total pngs to be removed")

    except Exception as e:
        print(f"Error in removing pngs not in manifest: {e}")
        return


def imgs_in_job_manifest(job_id):
    manifest_json = load_manifest(job_id)
    imgs_in_manifest = set()
    for domain in manifest_json:
        domain_json = manifest_json[domain]
        for timestamp in domain_json:
            timestamp_json = domain_json[timestamp]
            for layer_type in timestamp_json:
                layer_json = timestamp_json[layer_type]
                if "colorbar" in layer_json:
                    imgs_in_manifest.add(layer_json["colorbar"])
                if "kml" in layer_json:
                    imgs_in_manifest.add(sanitize_text(layer_json["kml"]))
                if "raster" in layer_json:
                    imgs_in_manifest.add(layer_json["raster"])

    return imgs_in_manifest


def archive_simulation(job_id, number_of_days):
    try:
        manifest_json = process_job_manifest(job_id, number_of_days, False)
        manifest_path = job_manifest_path(job_id)
        archive_manifest_path = archive_job_manifest_path(job_id)
        if os.path.exists(manifest_path):
            os.rename(manifest_path, archive_manifest_path)
        with open(manifest_path, "w") as file:
            json.dump(manifest_json, file, indent=4)
    except Exception as e:
        print(f"Error in recreate_manifest: {e}")
        return


def archive_simulation_dry_run(job_id, number_of_days):
    try:
        manifest_json = process_job_manifest(job_id, number_of_days, True)
        dry_run_manifest_path = dry_run_job_manifest_path(job_id)
        with open(dry_run_manifest_path, "w") as file:
            json.dump(manifest_json, file, indent=4)
    except Exception as e:
        print(f"Error in recreate_manifest: {e}")
        return


def delete_imgs_not_in_manifest(job_id):
    try:
        manifest_urls = job_manifest_urls(job_id)
        simulation_path = job_simulation_path(job_id)
        for entry in os.scandir(simulation_path):
            if entry.is_file():
                _, extension = os.path.splitext(entry.name)
                if extension == ".png" or extension == ".kmz":
                    if not entry.path in manifest_urls:
                        os.remove(entry.path)

    except Exception as e:
        print(f"Error in delete_imgs_not_in_manifest: {e}")
        return


def delete_old_fmda_imgs(job_id, number_of_days):
    try:
        count = 0
        simulation_path = job_simulation_path(job_id)
        for entry in os.scandir(simulation_path):
            if entry.is_file():
                filename, extension = os.path.splitext(entry.name)
                if extension == ".png" or extension == ".kmz":
                    if fmda_file_to_delete(filename, number_of_days):
                        count += 1
                        os.remove(entry.path)
                        if count % 10000 == 0:
                            print(f"Deleted {count} imgs")

    except Exception as e:
        print(f"Error in delete_old_imgs: {e}")


def delete_old_fmda_imgs_dry_run(job_id, number_of_days):
    try:
        simulation_path = job_simulation_path(job_id)
        count = 0
        for entry in os.scandir(simulation_path):
            if entry.is_file():
                filename, extension = os.path.splitext(entry.name)
                if extension == ".png" or extension == ".kmz":
                    if fmda_file_to_delete(filename, number_of_days):
                        count += 1
        print(f"Deleting {count} images")
    except Exception as e:
        print(f"Error in delete_old_imgs: {e}")


def fmda_file_to_delete(filename, number_of_days):
    timestamp = filename.split("-")[2]
    date_format = "%Y%m%d"
    datetime_timestamp = datetime.strptime(timestamp, date_format)
    age = (datetime.now() - datetime_timestamp).days
    return age > number_of_days


def delete_imgs_not_in_manifest_dry_run(job_id):
    try:
        manifest_urls = job_manifest_urls(job_id)
        simulation_path = job_simulation_path(job_id)
        count = 0
        for entry in os.scandir(simulation_path):
            if entry.is_file():
                _, extension = os.path.splitext(entry.name)
                if extension == ".png" or extension == ".kmz":
                    if not entry.path in manifest_urls:
                        count += 1
        print(f"Removing {count} files")
    except Exception as e:
        print(f"Error in delete_imgs_not_in_manifest_dry_run: {e}")
        return


def job_manifest_urls(job_id):
    manifest_json = load_manifest(job_id)
    simulation_path = job_simulation_path(job_id)
    manifest_urls = set()
    for domain in manifest_json:
        domain_json = manifest_json[domain]
        for timestamp in domain_json:
            timestamp_json = domain_json[timestamp]
            for layer_type in timestamp_json:
                layer_json = timestamp_json[layer_type]

                raster_url = os.path.join(simulation_path, layer_json["raster"])
                manifest_urls.add(raster_url)
                if "colorbar" in layer_json:
                    colorbar_url = os.path.join(simulation_path, layer_json["colorbar"])
                    manifest_urls.add(colorbar_url)
                if "kml" in layer_json:
                    kml_url = os.path.join(simulation_path, layer_json["kml"])
                    manifest_urls.add(kml_url)
    return manifest_urls


def process_job_manifest(job_id, number_of_days, dry_run):
    manifest_json = load_manifest(job_id)
    new_manifest = {}
    count = 0
    for domain in manifest_json:
        domain_json = manifest_json[domain]
        for timestamp in domain_json:
            timestamp_json = domain_json[timestamp]
            for layer_type in timestamp_json:
                layer_json = timestamp_json[layer_type]
                if timestamp_age_in_days(timestamp) > number_of_days:
                    if dry_run:
                        count += 1
                    else:
                        delete_timestamp_urls(job_id, layer_json)
                else:
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
    if dry_run:
        print(f"Will archive {count} timestamp urls")
    return new_manifest


def delete_timestamp_urls(job_id, layer_json):
    delete_url(job_id, layer_json["raster"])
    if "colorbar" in layer_json:
        delete_url(job_id, layer_json["colorbar"])
    if "kml" in layer_json:
        delete_url(job_id, layer_json["kml"])


def delete_url(job_id, url_to_delete):
    simulation_path = job_simulation_path(job_id)
    url_full_path = os.path.join(simulation_path, url_to_delete)
    if os.path.exists(url_full_path):
        os.remove(url_full_path)


def job_simulation_path(job_id):
    simulation_path = os.path.join(SIMULATIONS_FOLDER, job_id)
    return simulation_path


def job_manifest_path(job_id):
    manifest_filename = f"{job_id}.json"
    manifest_path = os.path.join(SIMULATIONS_FOLDER, job_id, manifest_filename)
    return manifest_path


def dry_run_job_manifest_path(job_id):
    manifest_filename = f"{job_id}_dry_run.json"
    manifest_path = os.path.join(SIMULATIONS_FOLDER, job_id, manifest_filename)
    return manifest_path


def archive_job_manifest_path(job_id):
    date = datetime.now().strftime("%Y%m%d")
    manifest_filename = f"{job_id}_{date}.json"
    manifest_path = os.path.join(SIMULATIONS_FOLDER, job_id, manifest_filename)
    return manifest_path


def timestamp_age_in_days(timestamp):
    date_format = "%Y-%m-%d_%H:%M:%S"
    datetime_timestamp = datetime.strptime(timestamp, date_format)
    return (datetime.now() - datetime_timestamp).days


def load_manifest(job_id):
    manifest_path = job_manifest_path(job_id)
    try:
        manifest_json = json.load(open(manifest_path))
        return manifest_json
    except Exception as e:
        print(f"Problem loading manifest at {manifest_path}: {e}")
        return {}


def inner_manifest(manifest, key):
    key = sanitize_text(key)
    if key in manifest:
        return manifest[key]
    inner_manifest = {}
    manifest[key] = inner_manifest
    return inner_manifest


def sanitize_text(text_input):
    return html.escape(text_input)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(
            "Please provide a job_id, number_of_days to keep, and dry_run boolean of a simulation to archive"
        )
    else:
        if sys.argv[3] == "0":
            archive_simulation(sys.argv[1], int(sys.argv[2]))
        else:
            archive_simulation_dry_run(sys.argv[1], int(sys.argv[2]))
