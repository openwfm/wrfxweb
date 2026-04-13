from workerQueue.actions.uploadAction import UPLOAD_ACTION, uploadAction
from workerQueue.actions.kmlAction import KML_ACTION, kmlAction
from workerQueue.actions.deleteAction import DELETE_ACTION, deleteAction
from workerQueue.actions.archiveAction import ARCHIVE_ACTION, archiveAction
from workerQueue.actions.zipAction import ZIP_ACTION, zipAction
from workerQueue.actions.processUploadAction import (
    PROCESS_UPLOAD_ACTION,
    processUploadAction,
)

ACTIONS_DICT = {
    UPLOAD_ACTION: uploadAction,
    KML_ACTION: kmlAction,
    DELETE_ACTION: deleteAction,
    ARCHIVE_ACTION: archiveAction,
    ZIP_ACTION: zipAction,
    PROCESS_UPLOAD_ACTION: processUploadAction,
}


def compose_action_queue_line(action_json):
    action_name = action_json["action"]
    action = ACTIONS_DICT[action_name]
    return action.compose_queue_line(action_json)


def parse_queue_line(queue_line):
    line_vars = queue_line.split(" ")
    action_name = line_vars[0]
    action = ACTIONS_DICT[action_name]
    return action.parse_queue_line(queue_line)
