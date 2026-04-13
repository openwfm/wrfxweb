from workerQueue.actions.processUploadAction import PROCESS_UPLOAD_ACTION
from workerQueue.app import app
from workerQueue.queue.worker_queue import worker_queue
import workerQueue.services.worker_services as worker_services

from workerQueue.utils import api_key_required

from flask import request


# when an enque, check if busy, if busy, add to queue. if not busy, post to worker, set to busy.
@app.route("/upload/process/enqueue/<catalog_id>", methods=["POST"])
@api_key_required
def equeue_process_upload(catalog_id):
    try:
        request_json = request.get_json()
        job_id = request_json["job_id"]
        action_json = {
            "action": PROCESS_UPLOAD_ACTION,
            "job_id": job_id,
            "catalog_id": catalog_id,
        }
        worker_queue.enqueue_action(action_json)
        if worker_services.worker_ready():
            worker_services.post_worker_start()
        return {"message": "Success!"}, 200
    except:
        return {"message": "Server Error"}, 500
