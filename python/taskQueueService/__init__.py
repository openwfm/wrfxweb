from taskQueueService.app import app
from taskQueueService import services

from flask import render_template


@app.route("/enqueue", methods=["POST"])
def equeue_task():
    return {"message": "Success!"}, 200
