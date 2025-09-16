from workerQueue.serviceKeys import (
    WORKER_QUEUE_FILE,
    WORKER_FAILED_ACTION_FILE,
    INVALID_ACTION_FILE,
)
import os
import workerQueue.logging.utils as loggingUtils
from workerQueue.actions.actions import compose_action_queue_line
import workerQueue.actions.actions as actions

import threading


class InvalidActionLog:
    def __init__(self):
        self.filename = INVALID_ACTION_FILE
        self.lock = threading.Lock()
        if not os.path.exists(self.filename):
            open(self.filename, "a").close()

    def write_failed_action(self, queue_line):
        with self.lock:
            with open(self.filename, "a") as file:
                file.write(queue_line)
        log_message = f"[FailedActionLog] {queue_line}"
        loggingUtils.standard_log("InvalidActionLog", log_message)


invalid_action_log = InvalidActionLog()


class EnqueueActionError(Exception):
    def __init__(self):
        message = "EnqueueActionError"
        super().__init__(message)


class ActionQueue:
    def __init__(self, file_path):
        self.LOGGING_AREA = "ActionQueue"
        self.filename = file_path
        self.lock = threading.Lock()
        if not os.path.exists(self.filename):
            open(self.filename, "a").close()

    def enqueue_action(self, action_json):
        try:
            queue_line = compose_action_queue_line(action_json)
            with self.lock:
                with open(self.filename, "a") as file:
                    file.write(f"{queue_line}\n")

            message = f"Enqueue: {queue_line}"
            loggingUtils.standard_log(self.LOGGING_AREA, message)
        except:
            message = f"Enqueue: {action_json}"
            loggingUtils.error_log(self.LOGGING_AREA, message)
            raise EnqueueActionError()

    def dequeue(self):
        queue_line = ""
        try:
            with self.lock:
                with open(self.filename, "r+") as file:
                    lines = file.readlines()
                    if len(lines) == 0:
                        return None
                    queue_line = lines[0].strip()
                    file.seek(0)
                    file.truncate()
                    file.writelines(lines[1:])
        except:
            message = f"Dequeue Error: could not read line"
            loggingUtils.error_log(self.LOGGING_AREA, message)
            return None

        try:
            response_params = actions.parse_queue_line(queue_line)
        except:
            invalid_action_log.write_failed_action(queue_line)
            return self.dequeue()

        message = f"Dequeue: {queue_line}"
        loggingUtils.standard_log(self.LOGGING_AREA, message)

        return response_params

    def peek(self):
        with self.lock:
            with open(self.filename, "r") as file:
                return file.readline().strip("\n")


failed_action_log = ActionQueue(WORKER_FAILED_ACTION_FILE)
worker_queue = ActionQueue(WORKER_QUEUE_FILE)
