from api.session import db_session
from api.models.catalogEntry.CatalogEntry import CatalogEntry
from api.models.catalogEntryCatalog.CatalogEntryCatalog import CatalogEntryCatalog
from api.services import (
    AdminServices as AdminServices,
    CatalogServices as CatalogServices,
    ColorbarServices as ColorbarServices,
    LayerTimestampServices as LayerTimestampServices,
    LayerTypeServices as LayerTypeServices,
    SimLayerServices as SimLayerServices,
)
from api.validators import (
    CatalogEntryValidators as CatalogEntryValidators,
    CatalogValidators as CatalogValidators,
    utils as validationUtils,
)
from api.apiKeys import (
    CLIENT_SERVER_API_KEYS,
    UPLOAD_API_KEYS,
    ADMIN_SERVICES_API_KEY,
)
import api.logging.utils as logging
import api.encryption as encryption

from sqlalchemy import select
import json
import os
import shutil
import posixpath as pxp
import simplekml as kml


def find_catalog_entry_catalogs(catalog_id, catalog_entry_id):
    catalog_entry_catalog = (
        db_session.query(CatalogEntryCatalog)
        .filter_by(catalog_id=catalog_id, catalog_entry_id=catalog_entry_id)
        .first()
    )
    return catalog_entry_catalog


def create_catalog_entry_catalog(catalog_id, catalog_entry_id):
    if catalog_id != 0:
        if find_catalog_entry_catalogs(catalog_id, catalog_entry_id) != None:
            return
        catalog_entry_catalog = CatalogEntryCatalog(
            catalog_id=catalog_id, catalog_entry_id=catalog_entry_id
        )
        db_session.add(catalog_entry_catalog)
        db_session.commit()


def create(json):
    try:
        catalog_entry_params = CatalogEntryValidators.validate_create_json(json)
        catalog_entry = CatalogEntry(
            uploader_id=catalog_entry_params["uploader_id"],
            entry_type=catalog_entry_params["entry_type"],
            from_utc=catalog_entry_params["from_utc"],
            to_utc=catalog_entry_params["to_utc"],
            description=catalog_entry_params["description"],
            manifest_path=catalog_entry_params["manifest_path"],
            job_id=catalog_entry_params["job_id"],
            zip_size=catalog_entry_params["zip_size"],
            kml_size=catalog_entry_params["kml_size"],
            processed_utc=catalog_entry_params["processed_utc"],
            run_utc=catalog_entry_params["run_utc"],
            zip_url=catalog_entry_params["zip_url"],
            kml_url=catalog_entry_params["kml_url"],
        )
        db_session.add(catalog_entry)
        db_session.commit()

        return catalog_entry
    except Exception:
        return None


def find_or_create(json):
    try:
        if "job_id" not in json:
            return None
        catalog_entry = find_by_job_id(json["job_id"])
        if catalog_entry == None:
            catalog_entry = create(json)
        return catalog_entry
    except Exception as e:
        logging.service_exception("CatalogEntry", "find_or_create", e)
        return None


def find_by_job_id(job_id):
    job_id = validationUtils.validate_text(job_id)
    job_id = encryption.encrypt_searchable_data(job_id)
    return db_session.scalar(select(CatalogEntry).where(CatalogEntry.job_id == job_id))


def find_by_id(catalog_entry_id):
    try:
        validated_catalog_entry_upload_id = CatalogEntryValidators.validate_id(
            catalog_entry_id
        )
        return db_session.query(CatalogEntry).get(validated_catalog_entry_upload_id)
    except Exception:
        return None


def mark_id_for_deletion(catalog_entry_id, user, admin_services_api_key):
    try:
        if not AdminServices.isAdmin(user, admin_services_api_key):
            return False
        catalog_entry = find_by_id(catalog_entry_id)
        if catalog_entry == None:
            return False
        catalog_entry.archived = True
        db_session.commit()
        return True
    except Exception as e:
        logging.service_exception("CatalogEntry", "mark_id_for_deletion", e)
        return False


def delete_by_id(catalog_entry_id, admin_services_api_key):
    try:
        if admin_services_api_key != ADMIN_SERVICES_API_KEY:
            return False
        catalog_entry = find_by_id(catalog_entry_id)
        if catalog_entry == None:
            return False
        sim_layers = catalog_entry.sim_layers()
        for sim_layer in sim_layers:
            SimLayerServices.delete(sim_layer, admin_services_api_key)
        catalog_entry_path = catalog_entry.entry_directory()
        if os.path.isdir(catalog_entry_path):
            shutil.rmtree(catalog_entry_path)
        catalog_entry.destroy()
        return True
    except Exception as e:
        logging.service_exception("CatalogEntry", "delete_by_id", e)
        return False


def user_entry(catalog_id, catalog_entry_id, user, client_server_api_key):
    try:
        if client_server_api_key not in CLIENT_SERVER_API_KEYS:
            raise PermissionError("Invalid ClientServerApiKey")

        catalog_entry = find_by_id(catalog_entry_id)
        catalog = CatalogServices.find_by_id(catalog_id)

        if catalog_entry == None or catalog == None:
            return None
        catalog_entry_catalog = (
            db_session.query(CatalogEntryCatalog)
            .filter_by(catalog_id=catalog.id, catalog_entry_id=catalog_entry.id)
            .first()
        )

        if not catalog.user_has_access(user) or catalog_entry_catalog == None:
            return None

        return catalog_entry
    except Exception:
        return None


def external_entries(catalog_id, upload_server_api_key):
    try:
        if upload_server_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        catalog = CatalogServices.find_by_id(catalog_id)
        if catalog == None:
            return []
        return catalog.entries()
    except Exception:
        return []


def user_entries(catalog_id, user, client_server_api_key):
    catalog = CatalogServices.user_catalog(user, catalog_id, client_server_api_key)
    if catalog == None:
        return []
    return catalog.entries()


def delete_stale_timestamps(catalog_entry_id, max_age_in_days, upload_server_api_key):
    try:
        if upload_server_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        catalog_entry = find_by_id(catalog_entry_id)
        if catalog_entry == None:
            return
        timestamps = catalog_entry.layer_timestamps()
        stale_timestamps = [
            timestamp
            for timestamp in timestamps
            if timestamp.age_in_days() > int(max_age_in_days)
        ]
        for timestamp in stale_timestamps:
            LayerTimestampServices.delete(timestamp, upload_server_api_key)

    except Exception as e:
        print(e)
        logging.service_exception("CatalogEntry", "delete_stale_timestamps", e)
        return


def recreate_manifest(catalog_entry_id, upload_server_api_key):
    try:
        if upload_server_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        catalog_entry = find_by_id(catalog_entry_id)
        if catalog_entry == None:
            return
        manifest_json = serialize_catalog_entry_manifest(catalog_entry)
        manifest_path = catalog_entry.web_manifest_path()
        if os.path.exists(manifest_path):
            os.remove(manifest_path)
        with open(manifest_path, "w") as file:
            json.dump(manifest_json, file, indent=4)
    except Exception as e:
        logging.service_exception("CatalogEntry", "recreate_mainfest", e)
        return


def inner_manifest(manifest, key):
    if key in manifest:
        return manifest[key]
    inner_manifest = {}
    manifest[key] = inner_manifest
    return inner_manifest


def serialize_catalog_entry_manifest(catalog_entry):
    entry_manifest = {}
    for sim_layer in catalog_entry.sim_layers():
        domain = validationUtils.sanitize_text(f"{sim_layer.domain}")
        layer_type = validationUtils.sanitize_text(sim_layer.layer_type.name)
        domain_manifest = inner_manifest(entry_manifest, domain)
        for layer_timestamp in sim_layer.layer_timestamps():
            timestamp = validationUtils.sanitize_text(layer_timestamp.timestamp)
            timestamp_json = inner_manifest(domain_manifest, timestamp)
            layer_json = inner_manifest(timestamp_json, layer_type)

            layer_json["kml"] = validationUtils.sanitize_text(layer_timestamp.kml_url())
            layer_json["raster"] = validationUtils.sanitize_text(
                layer_timestamp.png_url()
            )
            layer_json["coords"] = [
                [coord.latitude, coord.longitude] for coord in layer_timestamp.coords()
            ]

            colorbar = layer_timestamp.colorbar()
            if colorbar != None:
                layer_json["levels"] = [level.value for level in colorbar.levels()]
                layer_json["colorbar"] = validationUtils.sanitize_text(
                    colorbar.png_url()
                )

    return entry_manifest


def admin_entries(catalog_id, user, admin_services_api_key):
    catalog = CatalogServices.admin_catalog(user, catalog_id, admin_services_api_key)
    if catalog == None:
        return []
    return catalog.entries()


def admin_all_entries(user, admin_services_api_key):
    if AdminServices.isAdmin(user, admin_services_api_key):
        catalog_entries = db_session.query(CatalogEntry).all()
        return [
            catalog_entry
            for catalog_entry in catalog_entries
            if not catalog_entry.archived
        ]
    return []


def process_pngs(catalog_entry_id, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        catalog_entry = find_by_id(catalog_entry_id)
        created_timestamps = create_sim_layer_and_timestamp_records(
            catalog_entry, upload_api_key
        )
        return created_timestamps
    except Exception as e:
        logging.service_exception("CatalogEntry", "process_entry_pngs", e)
        return None


class ManifestLoadingError(Exception):
    def __init__(self, catalog_entry):
        message = f"Error loading manifest json: catalog_entry_id: {catalog_entry.id}"
        super().__init__(message)


def load_manifest(catalog_entry):
    manifest_path = catalog_entry.entry_manifest_path()
    try:
        manifest_json = json.load(open(manifest_path))
        return manifest_json
    except Exception:
        raise ManifestLoadingError(catalog_entry)


def create_sim_layer_and_timestamp_records(catalog_entry, upload_api_key):
    manifest_json = load_manifest(catalog_entry)
    simulation_path = catalog_entry.entry_path()
    created_count = 0
    for domain in manifest_json:
        domain_json = manifest_json[domain]
        for timestamp in domain_json:
            timestamp_json = domain_json[timestamp]
            for layer_type_name in timestamp_json:
                layer_json = timestamp_json[layer_type_name]
                raster_path = os.path.join(simulation_path, layer_json["raster"])
                if not os.path.exists(raster_path):
                    continue
                layer_type = create_layer_type(layer_type_name, upload_api_key)
                sim_layer = create_sim_layer(
                    catalog_entry, domain, layer_type, upload_api_key
                )
                layer_timestamp = create_layer_timestamp(
                    layer_json, sim_layer, timestamp, upload_api_key
                )
                create_colorbar(layer_json, layer_timestamp, upload_api_key)
                created_count += 1
    return created_count


class LayerTypeCreationError(Exception):
    def __init__(self, layer_type_name):
        message = f"Error creating LayerType: {layer_type_name}"
        super().__init__(message)


def create_layer_type(layer_type_name, upload_api_key):
    layer_type = LayerTypeServices.find_or_create(
        {"name": layer_type_name}, upload_api_key
    )
    if layer_type == None:
        raise LayerTypeCreationError(layer_type_name)
    return layer_type


class SimLayerCreationError(Exception):
    def __init__(self, sim_layer_json):
        message = f"Error creating SimLayer: {sim_layer_json}"
        super().__init__(message)


def create_sim_layer(catalog_entry, domain, layer_type, upload_api_key):
    sim_layer_json = {
        "layer_type_id": layer_type.id,
        "catalog_entry_id": catalog_entry.id,
        "domain": domain,
    }
    sim_layer = SimLayerServices.find_or_create(sim_layer_json, upload_api_key)
    if sim_layer == None:
        raise SimLayerCreationError(sim_layer_json)
    return sim_layer


class LayerTimestampCreationError(Exception):
    def __init__(self, layer_timestamp_json):
        message = f"Error creating LayerTimestamp: {layer_timestamp_json}"
        super().__init__(message)


def create_layer_timestamp(layer_json, sim_layer, timestamp, upload_api_key):
    layer_timestamp_json = {
        "sim_layer_id": sim_layer.id,
        "png_url": layer_json["raster"],
        "kml_url": layer_json["kml"] if "kml" in layer_json else None,
        "timestamp": timestamp,
        "coords": layer_json["coords"],
    }
    layer_timestamp = LayerTimestampServices.find_or_create(
        layer_timestamp_json, upload_api_key
    )
    if layer_timestamp == None:
        raise LayerTimestampCreationError(layer_timestamp_json)
    return layer_timestamp


class ColorbarCreationError(Exception):
    def __init__(self, colorbar_json):
        message = f"Error creating Colorbar: {colorbar_json}"
        super().__init__(message)


def create_colorbar(layer_json, layer_timestamp, upload_api_key):
    if "colorbar" not in layer_json:
        return
    colorbar_json = {
        "png_url": layer_json["colorbar"],
        "layer_timestamp_id": layer_timestamp.id,
        "levels": layer_json["levels"],
    }
    colorbar = ColorbarServices.find_or_create(colorbar_json, upload_api_key)
    if colorbar == None:
        raise ColorbarCreationError(colorbar_json)
    return colorbar


def zip_catalog_entry(catalog_entry_id, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        catalog_entry = find_by_id(catalog_entry_id)
        make_zip(catalog_entry)
        return catalog_entry
    except Exception as e:
        logging.service_exception("CatalogEntry", "zip_catalog_entry", e)
        return None


def make_zip(catalog_entry):
    job_path = catalog_entry.entry_path()
    zip_filepath = catalog_entry.zip_filepath()
    if os.path.exists(zip_filepath):
        os.remove(zip_filepath)
    shutil.make_archive(catalog_entry.zip_archive_base(), "zip", job_path)
    content_size = os.path.getsize(zip_filepath) / (1024 * 1024)
    catalog_entry.zip_size = round(content_size, 1)
    db_session.commit()


def kml_catalog_entry(catalog_entry_id, kmz_params, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        catalog_entry = find_by_id(catalog_entry_id)
        make_kmz(catalog_entry, kmz_params)
        return catalog_entry
    except Exception as e:
        logging.service_exception("CatalogEntry", "kml_catalog_entry", e)
        return None


class MakeKmzError(Exception):
    def __init__(self, catalog_entry, error):
        message = f"Error creating kmz for {catalog_entry.id}: {error}"
        super().__init__(message)


"""
    Create KMZ file from visualization stored in wrfxweb.
    :param job_id: string, the name of job directory
    :param steps: string '1,1,1,3' takes every 3rd frame in domain 4, etc. Default: all 1
    :param mode: string, 'inc', ' to include image files (default), 'ref' to use links only
    :param only_var: list of strings variables to include or None to include  all
"""


def make_kmz(catalog_entry, kmz_params):
    steps = kmz_params["steps"]
    mode = kmz_params["mode"]
    only_vars = kmz_params["only_vars"]

    # logging.info("make_kmz: job_id=%s" % job_id)
    # job_path = osp.join(osp.abspath(sys_cfg.sims_path), job_id)
    # job_path = catalog_entry.entry_path()
    # url_prefix = pxp.join(sys_cfg.url_root, sys_cfg.sims_url_path, job_id)
    # logging.debug("make_kmz: job_path %s" % job_path)
    # logging.debug("make_kmz: url_prefix %s" % url_prefix)

    kmz_filename = catalog_entry.kml_filename(mode)
    href_join = catalog_entry.kml_href_join(mode)
    if kmz_filename == None or href_join == None:
        raise MakeKmzError(catalog_entry, 'mode must be "inc" or "ref" or omitted')
    kmz_path = catalog_entry.kml_filepath(mode)
    href_prefix = catalog_entry.entry_directory()
    description = catalog_entry.entry_description()
    # if mode == "" or mode == "inc":
    #     kmz_filename = catalog_entry.kml_inc_filename()
    #     # kmz_filename = job_id + "_inc.kmz"
    #     # href_prefix = osp.abspath(job_path)
    #     href_join = os.path.join
    #     # logging.debug("make_kmz: kmz file will include images from %s" % href_prefix)
    #     # logging.info("make_kmz: kmz file will include images")
    # elif mode == "ref":
    #     kmz_filename = catalog_entry.kml_ref_filename()
    #     # kmz_filename = job_id + "_ref.kmz"
    #     # href_prefix = url_prefix
    #     href_join = pxp.join
    #     # logging.debug("make_kmz: kmz file will link to images from %s" % href_prefix)
    #     # logging.info("make_kmz: kmz file will link to images")
    # else:
    #     raise MakeKmzError(
    #         catalog_entry, 'make_kmz: mode must be "inc" or "ref" or omitted'
    #     )

    # read the catalog and the manifest
    # cat_path = osp.join(job_path, "catalog.json")
    # cat = json.load(open(cat_path))
    # if job_id not in cat:
    #     logging.error("job id %s not in the catalog" % job_id)
    #     sys.exit(1)
    # cat_entry = cat[job_id]
    # mf = json.load(open(osp.join(sys_cfg.sims_path, cat_entry["manifest_path"])))

    mf = json.load(catalog_entry.web_manifest_path())

    mdomain = max(list(map(int, list(mf.keys()))))
    if steps == "":
        step = [1]
    else:
        step = list(map(int, steps.split(",")))
    if len(step) == 1:
        step = step * mdomain
    elif len(step) != mdomain:
        raise MakeKmzError(
            catalog_entry, f"steps needed for all up to max domain number = {mdomain}"
        )
        # logging.error(
        #     "make_kmz: steps needed for all up to max domain number = %s" % mdomain
        # )
        # sys.exit(1)

    # description = cat_entry["description"]
    # logging.info("make_kmz: job description: %s" % description)

    # transpose var and time in manifest, output to frame
    frame = {}
    for domain in mf:
        for ts_esmf in mf[domain]:
            for var in mf[domain][ts_esmf]:
                if only_vars is None or var in only_vars:
                    update_nested_dict(
                        frame, {domain: {var: {ts_esmf: mf[domain][ts_esmf][var]}}}
                    )

    doc = kml.Kml(name=description)

    for domain in sorted(frame):
        domain_folder = doc.newfolder(name=domain)
        istep = step[int(domain) - 1]
        # logging.info("make_kmz: processing domain %s step %s" % (domain, istep))
        for var in frame[domain]:
            var_folder = domain_folder.newfolder(name=var)
            ts_esmf = sorted(frame[domain][var].keys())
            ts_esmf = ts_esmf[1::istep]
            ts_esmf1 = ts_esmf[1:]
            ts_esmf1.append(None)
            for ts_esmf, ts_esmf1 in zip(ts_esmf, ts_esmf1):
                ts_folder = var_folder.newfolder(name=ts_esmf)
                ts_folder.timespan.begin = ts_esmf.replace("_", "T") + "Z"
                if ts_esmf1 is not None:
                    ts_folder.timespan.end = ts_esmf1.replace("_", "T") + "Z"
                frame_data = frame[domain][var][ts_esmf]
                raster_path = frame_data["raster"]
                coords = frame_data["coords"]
                if "colorbar" in frame_data:
                    # add colorbar to KMZ
                    cb_path = frame_data["colorbar"]
                    cbo = ts_folder.newscreenoverlay(name="colorbar")
                    cbo.overlayxy = kml.OverlayXY(
                        x=0, y=1, xunits=kml.Units.fraction, yunits=kml.Units.fraction
                    )
                    cbo.screenxy = kml.ScreenXY(
                        x=0.02,
                        y=0.95,
                        xunits=kml.Units.fraction,
                        yunits=kml.Units.fraction,
                    )
                    cbo.size = kml.Size(
                        x=150, y=300, xunits=kml.Units.pixel, yunits=kml.Units.pixel
                    )
                    cbo.color = kml.Color.rgb(255, 255, 255, a=150)
                    cbo.visibility = 0
                    cbo.icon.href = href_join(href_prefix, cb_path)

                # add ground overlay
                ground = ts_folder.newgroundoverlay(name=var, color="80ffffff")
                ground.gxlatlonquad.coords = coords
                ground.visibility = 0
                ground.icon.href = href_join(href_prefix, raster_path)

    # build output file
    # kmz_path = osp.join(job_path, kmz_filename)
    # logging.info("make_kmz: creating file %s" % kmz_path)
    doc.savekmz(kmz_path)
    # url = pxp.join(url_prefix, kmz_filename)
    # logging.info("make_kmz: file created at %s" % url)

    content_size = os.path.getsize(kmz_path) / (1024 * 1024)
    catalog_entry.kml_size = round(content_size, 1)
    db_session.commit()
    # try:
    #     r = requests.get(url, stream=True)
    #     content_size = int(r.headers["Content-Length"])
    #     logging.info("make_kmz: file size is %s" % content_size)
    #     cat[job_id]["kml_url"] = url
    #     cat[job_id]["kml_size"] = content_size
    #     json.dump(cat, open(cat_path, "w"), indent=4, separators=(",", ": "))
    # except Exception as e:
    #     logging.warning(
    #         "make_kmz: accessing the file over the web failed with exception %s" % e
    #     )
