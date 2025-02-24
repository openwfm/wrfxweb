from clientServer.app import app
from clientServer.logging import utils as loggingUtils
from clientServer.routes.login import login_required
from clientServer.serverKeys import CLIENT_SERVER_API_KEY, SIMULATIONS_FOLDER
from api.services import CatalogServices as CatalogServices
from api.serializers import CatalogSerializer as CatalogSerializer
from api.serializers import CatalogEntrySerializer as CatalogEntrySerializer

from flask import send_from_directory
from flask_login import current_user


@app.route("/catalogs/", methods=["GET"])
@login_required
def client_catalogs():
    catalogs = CatalogServices.user_catalogs(current_user, CLIENT_SERVER_API_KEY)
    serialized_catalogs = CatalogSerializer.serialize_catalogs(catalogs)

    return {"message": "api successful", "catalogs": serialized_catalogs}, 200


@app.route("/catalogs/<catalog_id>/catalog_json", methods=["GET"])
@login_required
def client_catalog_json(catalog_id):
    catalog = CatalogServices.user_catalog(
        current_user, catalog_id, CLIENT_SERVER_API_KEY
    )
    if catalog == None:
        return {}, 200
    return CatalogEntrySerializer.serialize_catalog_entries(catalog.entries()), 200


@app.route("/catalogs/<catalog_id>/simulation/<path:filename>", methods=["GET"])
@login_required
def catalog_simulation(catalog_id, filename):
    catalog = CatalogServices.user_catalog(
        current_user, catalog_id, CLIENT_SERVER_API_KEY
    )
    if catalog == None:
        return {"message": "No Catalog found for provided catalog_id"}, 404

    catalog_folder = catalog.catalog_folder()
    return send_from_directory(f"{SIMULATIONS_FOLDER}/{catalog_folder}", filename)
