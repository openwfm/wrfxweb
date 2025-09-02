from workerQueue.app import app
from workerQueue.queue.worker_queue import worker_queue
import workerQueue.services.worker_services as worker_services

from workerQueue.utils import api_key_required

from api.services import CatalogEntryUploadServices as CatalogEntryUploadServices

from flask import abort


# when an enque, check if busy, if busy, add to queue. if not busy, post to worker, set to busy.
@app.route("upload/enqueue/<catalog_entry_upload_id>", methods=["POST"])
@api_key_required
def equeue_upload(catalog_entry_upload_id):
    validate_catalog_entry_upload_id(catalog_entry_upload_id)
    worker_queue.enqueue_upload(catalog_entry_upload_id)
    if worker_services.worker_ready():
        worker_services.post_worker_start()
    return {"message": "Success!"}, 200


def validate_catalog_entry_upload_id(catalog_entry_upload_id):
    if not catalog_entry_upload_id.isdigit():
        abort(400, "Posted catalog_entry_upload_id must be an integer")
    catalog_entry_upload = CatalogEntryUploadServices.find_by_id(
        catalog_entry_upload_id
    )
    if catalog_entry_upload == None:
        abort(400, "Posted catalog_entry_upload_id must be a valid CatalogEntryUpload")
