from clientServer.app import app
from clientServer.routes.login import login_required
from clientServer.serverKeys import (
    CLIENT_SERVER_API_KEY,
    FLASK_SIMULATIONS_FOLDER,
    MANIFEST_FILENAME,
    DOWNLOADS_FOLDER,
)

from api.services import CatalogEntryServices as CatalogEntryServices
from api.serializers import CatalogEntrySerializer as CatalogEntrySerializer

from flask_login import current_user
from flask import send_from_directory

import os.path as osp


@app.route("/catalogs/<catalog_id>/entries", methods=["GET"])
@login_required
def client_catalog_entries(catalog_id):
    catalog_entries = CatalogEntryServices.user_entries(
        catalog_id, current_user, CLIENT_SERVER_API_KEY
    )
    return CatalogEntrySerializer.serialize_catalog_entries(catalog_entries), 200


@app.route(
    "/catalogs/<catalog_id>/entries/<catalog_entry_id>/rasters",
    methods=["GET"],
)
@login_required
def catalog_entry_rasters_v1(catalog_id, catalog_entry_id):
    catalog_entry = CatalogEntryServices.user_entry(
        catalog_id, catalog_entry_id, current_user, CLIENT_SERVER_API_KEY
    )
    if catalog_entry == None:
        return {"message": "Requested Entry does not exist"}, 404

    manifest_path = osp.join(catalog_entry.folder_name(), MANIFEST_FILENAME)
    return send_from_directory(FLASK_SIMULATIONS_FOLDER, manifest_path)


@app.route(
    "/catalogs/<catalog_id>/entries/<catalog_entry_id>/rasters/v2",
    methods=["GET"],
)
@login_required
def catalog_entry_rasters_v2(catalog_id, catalog_entry_id):
    catalog_entry = CatalogEntryServices.user_entry(
        catalog_id, catalog_entry_id, current_user, CLIENT_SERVER_API_KEY
    )
    if catalog_entry == None:
        return {"message": "Requested Entry does not exist"}, 404

    return CatalogEntrySerializer.serialize_catalog_entry_manifest(catalog_entry), 200


@app.route(
    "/catalogs/<catalog_id>/entries/<catalog_entry_id>/zip",
    methods=["GET"],
)
@login_required
def catalog_entry_zip(catalog_id, catalog_entry_id):
    catalog_entry = CatalogEntryServices.user_entry(
        catalog_id, catalog_entry_id, current_user, CLIENT_SERVER_API_KEY
    )
    if catalog_entry == None:
        return {"message": "Requested Entry does not exist"}, 404

    zip_filename = catalog_entry.zip_filename()

    return send_from_directory(DOWNLOADS_FOLDER, zip_filename, as_attachment=True)


@app.route(
    "/catalogs/<catalog_id>/entries/<catalog_entry_id>/kml",
    methods=["GET"],
)
@login_required
def catalog_entry_kml(catalog_id, catalog_entry_id):
    catalog_entry = CatalogEntryServices.user_entry(
        catalog_id, catalog_entry_id, current_user, CLIENT_SERVER_API_KEY
    )
    if catalog_entry == None:
        return {"message": "Requested Entry does not exist"}, 404

    zip_filename = catalog_entry.zip_filename()
    return send_from_directory(DOWNLOADS_FOLDER, zip_filename, as_attachment=True)


@app.route(
    "/catalogs/<catalog_id>/entries/<catalog_entry_id>/simulation/<path:file_path>",
    methods=["GET"],
)
@login_required
def catalog_entry_simulations(catalog_id, catalog_entry_id, file_path):
    catalog_entry = CatalogEntryServices.user_entry(
        catalog_id, catalog_entry_id, current_user, CLIENT_SERVER_API_KEY
    )
    if catalog_entry == None:
        return {"message": "Requested Entry does not exist"}, 404

    directory = f"{FLASK_SIMULATIONS_FOLDER}/{catalog_entry.folder_name()}"
    return send_from_directory(directory, file_path)
