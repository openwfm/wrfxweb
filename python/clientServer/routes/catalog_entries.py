from clientServer.app import app
from clientServer.routes.login import login_required
from clientServer.serverKeys import CLIENT_SERVER_API_KEY

from api.services import CatalogEntryServices as CatalogEntryServices
from api.serializers import CatalogEntrySerializer as CatalogEntrySerializer

from flask_login import current_user
from flask import send_from_directory


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
def catalog_entry_rasters(catalog_id, catalog_entry_id):
    catalog_entry = CatalogEntryServices.user_entry(
        catalog_id, catalog_entry_id, current_user, CLIENT_SERVER_API_KEY
    )
    if catalog_entry == None:
        return {"message": "Requested Entry does not exist"}, 404

    manifest_path = catalog_entry.manifest_path
    return send_from_directory(catalog_entry.directory(), manifest_path)


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

    return send_from_directory(catalog_entry.entry_path(), file_path)
