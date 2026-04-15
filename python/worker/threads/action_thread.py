from worker.logging import utils as loggingUtils
from worker.services.queue_services import queue_services
from worker.actions.upload import upload_action
from worker.actions.kml import kml_action
from worker.actions.zip import zip_action
from worker.actions.archive import archive_action
from worker.actions.delete import delete_action
from worker.actions.processUpload import process_upload_action

import threading

REFETCH_ATTEMPTS = 5
LOGGING_AREA = "ActionThread"


KML_ACTION = "KML"
UPLOAD_ACTION = "UPLOAD"
ZIP_ACTION = "ZIP"
ARCHIVE_ACTION = "ARCHIVE"
DELETE_ACTION = "DELETE"
PROCESS_UPLOAD_ACTION = "PROCESS_UPLOAD"


ACTIONS_DICT = {
    UPLOAD_ACTION: upload_action,
    KML_ACTION: kml_action,
    ZIP_ACTION: zip_action,
    ARCHIVE_ACTION: archive_action,
    DELETE_ACTION: delete_action,
    PROCESS_UPLOAD_ACTION: process_upload_action,
}


class ActionThread:
    def __init__(self):
        self.thread = None

    def ready(self):
        return self.thread == None or not self.thread.is_alive()

    def start(self):
        self.thread = threading.Thread(target=self.process_and_dequeue)
        self.thread.start()

    def process_and_dequeue(self):
        next_action_params = self.fetch_action_params(REFETCH_ATTEMPTS)
        if next_action_params == None:
            self.thread_log("No actions left to process")
            return
        try:
            self.process_action(next_action_params)
        except:
            self.thread_error(f"Could not process action: {next_action_params}")
            self.post_failed_action(REFETCH_ATTEMPTS, next_action_params)

        self.process_and_dequeue()

    def process_action(self, action_params):
        action_name = action_params["action"]
        action = ACTIONS_DICT[action_name]
        action.process(action_params)

    def fetch_action_params(self, attempts):
        if attempts == 0:
            self.thread_error(
                f"fetch_action_params: Could not connect to queue service after {attempts} attempts"
            )
            return None
        next_action_params = queue_services.get_dequeue()

        if next_action_params == -1:
            return self.fetch_action_params(attempts - 1)
        return next_action_params

    def post_failed_action(self, attempts, action_params):
        if attempts == 0:
            self.thread_error(
                f"post_failed_action: Could not connect to queue service after {REFETCH_ATTEMPTS} attempts"
            )
            return
        post_success = queue_services.post_failed_action(action_params)
        if post_success == -1:
            return self.post_failed_action(attempts - 1, action_params)

    def thread_log(self, message):
        loggingUtils.standard_log(LOGGING_AREA, message)

    def thread_error(self, message):
        loggingUtils.error_log(LOGGING_AREA, message)


action_thread = ActionThread()
