from ..app import app

from flask import send_from_directory

from flask_login import current_user

import datetime


@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory("../../fdds/js", filename)


@app.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory("../../fdds/css", filename)


@app.route("/simulations/<path:filename>")
def serve_simulations(filename):
    return send_from_directory("../../fdds/simulations", filename)


@app.route("/simulation/<path:filename>")
def serve_simulation(filename):
    time_now = datetime.datetime.now().strftime("%Y-%m-%d:%H-%M-%S")
    app.logger.info(
        f"[SimulationAccess] {current_user.email} {time_now} {filename.split('/')[0]}"
    )
    return send_from_directory("../../fdds/simulations", filename)


@app.route("/threadManager.js")
def serve_thread_manager():
    return send_from_directory("../../fdds", "threadManager.js")


@app.route("/imageLoadingWorker.js")
def serve_image_loading_worker():
    return send_from_directory("../../fdds", "imageLoadingWorker.js")


@app.route("/conf")
def serve_conf():
    return send_from_directory("../../fdds", "conf.json")


@app.route("/catalog", methods=["GET"])
def catalog():
    return send_from_directory("../../fdds/simulations", "catalog.json")
