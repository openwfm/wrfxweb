from workerQueue.actions.processUploadAction import PROCESS_UPLOAD_ACTION
from workerQueue.app import app
from workerQueue.queue.worker_queue import worker_queue
import workerQueue.services.worker_services as worker_services

import api.services.CatalogServices as CatalogServices

from workerQueue.utils import api_key_required

from flask import request


# when an enque, check if busy, if busy, add to queue. if not busy, post to worker, set to busy.
@app.route("/upload/process/enqueue", methods=["POST"])
@app.route("/upload/process/enqueue/<catalog_id>", methods=["POST"])
@api_key_required
def equeue_process_upload(catalog_id=None):
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


# when an enque, check if busy, if busy, add to queue. if not busy, post to worker, set to busy.
@app.route("/upload/process/enqueue/public", methods=["POST"])
@api_key_required
def equeue_public_process_upload():
    try:
        request_json = request.get_json()
        job_id = request_json["job_id"]
        public_catalogs = CatalogServices.find_public_catalogs()
        catalog_id = public_catalogs[0].id if len(public_catalogs) > 0 else None
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
