from clientServer.app import app
from clientServer.logging import utils as loggingUtils
from clientServer.routes.login import login_required
from clientServer.serverKeys import CLIENT_SERVER_API_KEY
from api.services import CatalogServices as CatalogServices
from api.serializers import CatalogSerializer as CatalogSerializer
from api.serializers import CatalogEntrySerializer as CatalogEntrySerializer

from flask_login import current_user


@app.route("/catalogs/", methods=["GET"])
@login_required
def client_catalogs():
    catalogs = CatalogServices.user_catalogs(current_user, CLIENT_SERVER_API_KEY)
    serialized_catalogs = CatalogSerializer.serialize_catalogs(catalogs)

    return {"message": "api successful", "catalogs": serialized_catalogs}, 200
