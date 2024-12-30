from .app import db, app
from .serverKeys import CLIENT_SERVER_SECRET
from . import routes
from .routes.login import login_required

from flask import render_template

app.secret_key = CLIENT_SERVER_SECRET

with app.app_context():
    db.create_all()


@app.route("/")
@login_required
def index():
    return render_template("index.html")
