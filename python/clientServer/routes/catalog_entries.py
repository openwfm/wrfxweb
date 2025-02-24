from clientServer.app import app
from clientServer.routes.login import login_required
from clientServer.serverKeys import CLIENT_SERVER_API_KEY, SIMULATIONS_FOLDER

from api.services import CatalogServices as CatalogServices
from api.serializers import CatalogEntrySerializer as CatalogEntrySerializer

from flask_login import current_user
from flask import send_from_directory


@app.route("/catalogs/<catalog_id>/entries", methods=["GET"])
@login_required
def client_catalog_entries(catalog_id):
    catalog = CatalogServices.user_catalog(
        current_user, catalog_id, CLIENT_SERVER_API_KEY
    )
    if catalog == None:
        return [], 200
    return CatalogEntrySerializer.serialize_catalog_entries(catalog.entries()), 200


@app.route(
    "/catalogs/<catalog_id>/entries/<entry_id>/simulation/<path:filename>",
    methods=["GET"],
)
@login_required
def catalog_entry_simulations(catalog_id, entry_id, filename):
    catalog = CatalogServices.user_catalog(
        current_user, catalog_id, CLIENT_SERVER_API_KEY
    )
    if catalog == None:
        return {"message": "No Catalog found for provided catalog_id"}, 404

    catalog_folder = catalog.catalog_folder()
    return send_from_directory(f"{SIMULATIONS_FOLDER}/{catalog_folder}", filename)
