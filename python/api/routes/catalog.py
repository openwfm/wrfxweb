from ..api import api


@api.route("/api/catalog/all", methods=["GET"])
def all_catalogs():
    return {"message": "api successful"}, 200
