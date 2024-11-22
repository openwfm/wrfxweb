from .app import db, app
from .serverKeys import CLIENT_SECRET
from . import routes

from flask import (
    render_template,
    send_from_directory,
    url_for,
    redirect,
)
from flask_login import current_user
from functools import wraps

app.secret_key = CLIENT_SECRET

with app.app_context():
    db.create_all()


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if current_user.is_anonymous:
            return redirect(url_for("login_page"))
        else:
            return f(*args, **kwargs)

    return wrapper


@app.route("/")
@login_required
def index():
    return render_template("index.html")


@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory("../../fdds/js", filename)


@app.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory("../../fdds/css", filename)


@app.route("/simulations/<path:filename>")
def serve_simulations(filename):
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
    return {"catalogUrl": "simulations/catalog.json"}
