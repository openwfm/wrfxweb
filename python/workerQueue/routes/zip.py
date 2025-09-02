from workerQueue.app import app
from workerQueue.queue.worker_queue import worker_queue

from workerQueue.utils import api_key_required

from flask import abort


# when an enque, check if busy, if busy, add to queue. if not busy, post to worker, set to busy.
@app.route("zip/enqueue/<catalog_entry_id>", methods=["POST"])
@api_key_required
def equeue_zip(catalog_entry_id):
    validate_catalog_entry_id(catalog_entry_id)
    worker_queue.enqueue_upload(catalog_entry_id)
    return {"message": "Success!"}, 200


def validate_catalog_entry_id(catalog_entry_id):
    if not catalog_entry_id.isdigit():
        abort(400, "Posted catalog_entry_upload_id must be an integer")
