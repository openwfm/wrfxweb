from clientServer.app import app
from clientServer import routes
from clientServer.routes.login import login_required

from flask import render_template


@app.route("/")
@login_required
def index():
    return render_template("index.html")
