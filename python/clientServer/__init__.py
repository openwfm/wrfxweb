from clientServer.app import db, app
from clientServer import routes
from clientServer.routes.login import login_required

from flask import render_template

with app.app_context():
    db.create_all()


@app.route("/")
@login_required
def index():
    return render_template("index.html")
