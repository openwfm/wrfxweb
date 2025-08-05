from externalServer.app import app

from externalServer.utils import api_key_required, universal_api_key_required

from externalServer import routes


@app.route("/server-ready/<catalog_id>", methods=["GET"])
@api_key_required
def catalog_server_ready(catalog_id):
    return {
        "message": "Success!",
    }, 200


@app.route("/server-ready", methods=["GET"])
@universal_api_key_required
def server_ready():
    return {
        "message": "Success!",
    }, 200
