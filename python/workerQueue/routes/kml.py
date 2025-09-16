from workerQueue.app import app
from workerQueue.queue.worker_queue import worker_queue
import workerQueue.services.worker_services as worker_services
from workerQueue.actions.kmlAction import KML_ACTION

from workerQueue.utils import api_key_required

from api.services import CatalogEntryServices as CatalogEntryServices

from flask import abort, request


# when an enque, check if busy, if busy, add to queue. if not busy, post to worker, set to busy.
@app.route("/kml/enqueue/<catalog_entry_id>", methods=["POST"])
@api_key_required
def equeue_kml(catalog_entry_id):
    try:
        kml_params = request_kml_params(catalog_entry_id)
        worker_queue.enqueue_action(kml_params)

        if worker_services.worker_ready():
            worker_services.post_worker_start()
        return {"message": "Success!"}, 200
    except:
        return {"message": "Server Error"}, 500


def request_kml_params(catalog_entry_id):
    try:
        kml_params = request.get_json()
        catalog_entry = validate_catalog_entry_id(catalog_entry_id)
        steps = CatalogEntryServices.verify_steps(kml_params["steps"])
        if steps == "":
            steps = None

        return {
            "action": KML_ACTION,
            "catalog_entry_id": catalog_entry_id,
            "steps": steps,
            "mode": CatalogEntryServices.verify_mode(kml_params["mode"]),
            "only_vars": CatalogEntryServices.verify_only_vars(
                kml_params["only_vars"], catalog_entry
            ),
        }
    except:
        abort(400, "Posted kml params must include steps, mode, and only_vars")


def validate_catalog_entry_id(catalog_entry_id):
    if not catalog_entry_id.isdigit():
        abort(400, "Posted catalog_entry_upload_id must be an integer")
    catalog_entry = CatalogEntryServices.find_by_id(catalog_entry_id)
    if catalog_entry == None:
        abort(400, "Posted catalog_entry_id must be a valid CatalogEntry")
    return catalog_entry
