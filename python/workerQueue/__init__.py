from workerQueue.app import app
from workerQueue.queue.worker_queue import worker_queue

from workerQueue.utils import api_key_required

from workerQueue import routes


# called after worker done with last upload. if queue empty, set busy to false. else, pop queue and respond
# with next upload task
@app.route("/dequeue", methods=["GET"])
@api_key_required
def dequeue_upload():
    worker_queue.dequeue()
    next_task = worker_queue.peek()
    if next_task == "":
        return {"message": "Queue is Empty!"}, 204
    else:
        return {"catalog_entry_upload_id": next_task}
