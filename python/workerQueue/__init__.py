from workerQueue.app import app
from workerQueue.queue.worker_queue import worker_queue

from workerQueue.utils import api_key_required

from workerQueue import routes


# called after worker done with last upload. if queue empty, set busy to false. else, pop queue and respond
# with next upload task
@app.route("/dequeue", methods=["GET"])
@api_key_required
def dequeue():
    task_params = worker_queue.dequeue()
    if task_params == None:
        return {"message": "Queue is Empty!"}, 204
    else:
        return task_params, 200
