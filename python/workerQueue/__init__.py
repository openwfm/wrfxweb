from workerQueue.app import app
from workerQueue.queue.worker_queue import worker_queue, failed_action_log

from workerQueue.utils import api_key_required

from workerQueue import routes

from flask import request


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


# called if worker encounters error
@app.route("/fail", methods=["POST"])
@api_key_required
def worker_fail():
    action_json = request.get_json()
    try:
        failed_action_log.enqueue_action(action_json)
        return {"message": "Success!"}, 200
    except:
        return {"message": "Queue Service encountered an error"}, 500
