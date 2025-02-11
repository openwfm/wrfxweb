from clientServer.app import app
from clientServer.logging import utils as loggingUtils
from clientServer.routes.login import login_required
from clientServer.validators import CatalogValidators as CatalogValidators
from clientServer.services import CatalogServices as CatalogServices
from clientServer.serializers import CatalogSerializer as CatalogSerializer
from clientServer.serverKeys import SIMULATIONS_FOLDER

from flask import send_from_directory
from flask_login import current_user


@app.route("/catalogs/", methods=["GET"])
@login_required
def client_catalogs():
    catalogs = CatalogServices.find_by_user(current_user)
    serialized_catalogs = CatalogSerializer.serialize_catalogs(catalogs)

    return {"message": "api successful", "catalogs": serialized_catalogs}, 200


@app.route("/catalogs/<catalog_id>/catalog_json", methods=["GET"])
@login_required
def client_catalog_json(catalog_id):
    catalog = CatalogServices.find_by_id(catalog_id)

    catalog_folder = catalog.catalog_folder()

    catalog_path = f"{SIMULATIONS_FOLDER}/{catalog_folder}"

    return send_from_directory(catalog_path, "catalog.json")


@app.route("/catalogs/<catalog_id>/simulation/<path:filename>", methods=["GET"])
@login_required
def catalog_simulation(catalog_id, filename):
    catalog = CatalogValidators.validate_user_catalog_id(catalog_id)

    catalog_folder = catalog.catalog_folder()
    return send_from_directory(f"{SIMULATIONS_FOLDER}/{catalog_folder}", filename)
