# Copyright (C) 2013-2016 Martin Vejmelka, UC Denver
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
# of the Software, and to permit persons to whom the Software is furnished to do
# so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR
# A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


from __future__ import absolute_import
from __future__ import print_function

from clientServer.app import app
from clientServer.routes.wrfxctrl.wrfxctrl_utils import (
    wrfxctrl_access_required,
    wrfxctrl_api_key_required,
)
from clientServer.serverKeys import (
    WRFXCTRL_BUILD_HTML,
    WRFXCTRL_START_HTML,
    WRFXCTRL_OVERVIEW_HTML,
    WRFXCTRL_JS_FOLDER,
    WRFXCTRL_FOLDER,
    WRFXCTRL_SERVER_URL,
    WRFXCTRL_API_KEY,
)
from api.services import WrfxctrlAccessServices as WrfxctrlAccessServices
from api.services import WrfxctrlJobServices as WrfxctrlJobServices
from api.serializers import WrfxctrlAccessSerializer as WrfxctrlAccessSerializer
from api.serializers import WrfxctrlJobSerializer as WrfxctrlJobSerializer

from clientServer.routes.wrfxctrl.utils import Dict, validate_job_json
from clientServer.routes.wrfxctrl.wrfxctrl_config import profiles
from flask_login import current_user
from flask import (
    send_file,
    request,
    redirect,
    abort,
    send_from_directory,
)
import requests


@app.route("/jobs/status", methods=["POST"])
@wrfxctrl_api_key_required
def status():
    if request.method == "POST":
        try:
            request_json = request.get_json()
            job_id = request_json["job_id"]
            status = request_json["status"]
            wrfxctrl_job = WrfxctrlJobServices.update_status_by_job_id(job_id, status)
            if wrfxctrl_job == None:
                return {"message": "Wrfxctrl Job status unable to be updated"}, 500
            return {"message": "Success!"}, 200
        except:
            abort(500)
    abort(405)


@app.route("/jobs", methods=["GET"])
@wrfxctrl_access_required
def welcome():
    if request.method == "GET":
        return send_file(WRFXCTRL_START_HTML)
    abort(405)


@app.route("/jobs/all", methods=["GET"])
@wrfxctrl_access_required
def user_jobs():
    if request.method == "GET":
        try:
            wrfxctrl_jobs = WrfxctrlJobServices.find_by_user_id(current_user.id)
            return {
                "wrfxctrl_jobs": WrfxctrlJobSerializer.serialize_wrfxctrl_jobs(
                    wrfxctrl_jobs
                )
            }, 200
        except:
            abort(500)
    abort(405)


@app.route("/jobs/build", methods=["GET", "POST"])
@wrfxctrl_access_required
def build():
    if request.method == "GET":
        return send_file(WRFXCTRL_BUILD_HTML)
    elif request.method == "POST":
        try:
            sim_cfg = request.form.copy()
            validated_job_json = validate_job_json(sim_cfg, current_user)

            post_url = f"{WRFXCTRL_SERVER_URL}/jobs/enqueue"
            headers = {
                "Content-type": "application/json",
                "API-Key": WRFXCTRL_API_KEY,
            }
            response = requests.post(post_url, headers=headers, json=validated_job_json)
            response.raise_for_status()

            response_json = response.json()
            job_id = response_json["job_id"]
            description = validated_job_json["description"]
            catalog_id = validated_job_json["catalog_id"]

            WrfxctrlJobServices.find_or_create(
                current_user.id, job_id, catalog_id, description
            )

            return redirect("/jobs/overview")
        except:
            abort(500)
    abort(405)


@app.route("/profiles")
@wrfxctrl_access_required
def get_profiles():
    return {"profiles": [Dict(p) for _, p in profiles.items()]}, 200


@app.route("/jobs/overview", methods=["GET"])
@wrfxctrl_access_required
def overview():
    if request.method == "GET":
        return send_file(WRFXCTRL_OVERVIEW_HTML)
    abort(405)


@app.route("/jobs/js/<path:filename>")
@wrfxctrl_access_required
def serve_wrfxctrl_js(filename):
    return send_from_directory(WRFXCTRL_JS_FOLDER, filename)


@app.route("/jobs/<path:filename>")
@wrfxctrl_access_required
def serve_wrfxctrl(filename):
    return send_from_directory(WRFXCTRL_FOLDER, filename)
