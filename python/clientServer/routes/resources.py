from clientServer.app import app
from clientServer.serverKeys import (
    JS_FOLDER,
    CSS_FOLDER,
    RESOURCE_FOLDER,
    CATALOG_FOLDER,
    CONF_FOLDER,
)

from flask import send_from_directory


@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory(JS_FOLDER, filename)


@app.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory(CSS_FOLDER, filename)


@app.route("/threadManager.js")
def serve_thread_manager():
    return send_from_directory(RESOURCE_FOLDER, "threadManager.js")


@app.route("/services.js")
def serve_services():
    return send_from_directory(RESOURCE_FOLDER, "services.js")


@app.route("/imageLoadingWorker.js")
def serve_image_loading_worker():
    return send_from_directory(RESOURCE_FOLDER, "imageLoadingWorker.js")


@app.route("/conf")
def serve_conf():
    return send_from_directory(CONF_FOLDER, "conf.json")


@app.route("/catalog", methods=["GET"])
def catalog():
    return send_from_directory(CATALOG_FOLDER, "catalog.json")
