from clientServer.app import app
from clientServer.routes.login import login_required


@app.route("/catalogs/<catalog_id>/entries", methods=["GET"])
@login_required
def client_catalog_entries(catalog_id):
    return {"message": "api successful"}, 200
