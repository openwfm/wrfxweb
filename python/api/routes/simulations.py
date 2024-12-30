from ..api import api


@api.route("/api/simulation", methods=["GET"])
def simulation():
    return {"message": "api successful"}, 200
