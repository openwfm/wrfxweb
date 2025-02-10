from clientServer.app import app
from clientServer.routes.login import login_required
from clientServer.serverKeys import SIMULATIONS_FOLDER

from flask import send_from_directory


@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory("../../fdds/js", filename)


@app.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory("../../fdds/css", filename)


@app.route("/admin/css/<path:filename>")
def serve_admin_css(filename):
    return send_from_directory("../../fdds/admin/css", filename)


@app.route("/admin/js/<path:filename>")
def serve_admin_js(filename):
    return send_from_directory("../../fdds/admin/js", filename)


@app.route("/simulations/<path:filename>")
def serve_simulations(filename):
    return send_from_directory("../../fdds/simulations", filename)


@app.route("/simulation/<path:filename>")
@login_required
def serve_simulation(filename):
    return send_from_directory(f"{SIMULATIONS_FOLDER}", filename)


@app.route("/threadManager.js")
def serve_thread_manager():
    return send_from_directory("../../fdds", "threadManager.js")


@app.route("/services.js")
def serve_services():
    return send_from_directory("../../fdds", "services.js")


@app.route("/imageLoadingWorker.js")
def serve_image_loading_worker():
    return send_from_directory("../../fdds", "imageLoadingWorker.js")


@app.route("/conf")
def serve_conf():
    return send_from_directory("../../fdds", "conf.json")


@app.route("/catalog", methods=["GET"])
def catalog():
    return send_from_directory("../../fdds/simulations", "catalog.json")
