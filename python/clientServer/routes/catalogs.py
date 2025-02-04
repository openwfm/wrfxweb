from clientServer.app import app
from clientServer.routes.login import login_required
from clientServer.services import CatalogServices as CatalogServices
from clientServer.serializers import CatalogSerializer as CatalogSerializer

from flask_login import current_user


@app.route("/catalogs/", methods=["GET"])
@login_required
def client_catalogs():
    catalogs = CatalogServices.find_by_user(current_user)
    serialized_catalogs = CatalogSerializer.serialize_catalogs(catalogs)

    return {"message": "api successful", "catalogs": serialized_catalogs}, 200
