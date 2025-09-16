from workerQueue.app import app
from workerQueue.queue.worker_queue import worker_queue
from workerQueue.actions.zipAction import ZIP_ACTION
import workerQueue.services.worker_services as worker_services

from workerQueue.utils import api_key_required


# when an enque, check if busy, if busy, add to queue. if not busy, post to worker, set to busy.
@app.route("/zip/enqueue/<catalog_entry_id>", methods=["POST"])
@api_key_required
def equeue_zip(catalog_entry_id):
    try:
        action_json = {"action": ZIP_ACTION, "catalog_entry_id": catalog_entry_id}
        worker_queue.enqueue_action(action_json)
        if worker_services.worker_ready():
            worker_services.post_worker_start()
        return {"message": "Success!"}, 200
    except:
        return {"message": "Server Error"}, 500
