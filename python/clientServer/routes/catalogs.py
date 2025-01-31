from clientServer.app import app
from clientServer.routes.login import login_required


@app.route("/catalogs/<catalog_id>", methods=["GET"])
@login_required
def all_catalogs(catalog_id):
    return {"message": "api successful"}, 200
