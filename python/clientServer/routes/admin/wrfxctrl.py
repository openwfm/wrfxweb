from clientServer.app import app
from clientServer.routes.admin.admin_utils import admin_login_required
from api.services import WrfxctrlAccessServices as WrfxctrlAccessServices
from api.serializers import WrfxctrlAccessSerializer as WrfxctrlAccessSerializer

from flask import abort, request


@app.route("/jobs/access", methods=["GET", "POST"])
@admin_login_required
def wrfxctrl_access():
    try:
        if request.method == "GET":
            catalog_accesses = WrfxctrlAccessServices.find_all()
            return {
                "wrfxctrl_accesses": WrfxctrlAccessSerializer.serialize_accesses(
                    catalog_accesses
                )
            }, 200
        elif request.method == "POST":
            access_json = request.get_json()
            wrfxctrl_access = WrfxctrlAccessServices.create(access_json["email"])
            return {
                "wrfxctrl_access": WrfxctrlAccessSerializer.serialize_access(
                    wrfxctrl_access
                )
            }, 200
        abort(405)
    except:
        abort(500)


@app.route("/jobs/access/<access_id>", methods=["DELETE"])
@admin_login_required
def delete_wrfxctrl_access(access_id):
    try:
        if request.method == "DELETE":
            WrfxctrlAccessServices.destroy_by_id(access_id)
            return {"message": "Sucess!"}, 200
        abort(405)
    except:
        abort(500)
