from ..api import api


@api.route("/api/catalogs/all", methods=["GET"])
def all_catalogs():
    return {"message": "api successful"}, 200
