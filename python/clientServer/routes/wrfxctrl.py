from clientServer.app import app
from clientServer.routes.admin.admin_utils import admin_login_required
from clientServer.routes.login import login_required
from clientServer.serverKeys import WRFXCTRL_BASE_URL
from api.services import WrfxctrlAccessServices as WrfxctrlAccessServices
from api.serializers import WrfxctrlAccessSerializer as WrfxctrlAccessSerializer
from api.services import AdminServices as AdminServices

from flask_login import current_user
from flask import abort, request, redirect
from urllib.parse import urljoin


@app.route("/jobs/build", methods=["GET", "POST"])
@login_required
def wrfxctrl_build():
    if request.method == "GET":
        if not WrfxctrlAccessServices.user_has_access(current_user):
            abort(403)
        return redirect(urljoin(WRFXCTRL_BASE_URL, "start"))

    elif request.method == "POST":
        return {"message": "success!"}, 200
    abort(405)


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
