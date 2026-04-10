from clientServer.app import app
from clientServer.routes.login import login_required
from clientServer.serverKeys import WRFXCTRL_BASE_URL
from api.services import WrfxctrlAccessServices as WrfxctrlAccessServices

from flask_login import current_user
from flask import abort, request, redirect
from urllib.parse import urljoin


@app.route("/jobs/build", methods=["GET", "POST"])
@login_required
def wrfxctrl_build():
    if request.method == "GET":
        if not WrfxctrlAccessServices.user_has_access(current_user):
            abort(404)
        return redirect(urljoin(WRFXCTRL_BASE_URL, "start"))

    elif request.method == "POST":
        return {"message": "success!"}, 200
    abort(405)
