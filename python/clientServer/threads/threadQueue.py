import threading
from queue import Queue


class ThreadQueue:
    def __init__(self):
        self.upload_queue = Queue()
        self.upload_queue_lock = threading.Lock()

    def put(self, queue_entry):
        with self.upload_queue_lock:
            self.upload_queue.put(queue_entry)

    def get(self):
        with self.upload_queue_lock:
            return self.upload_queue.get()

    def empty(self):
        with self.upload_queue_lock:
            return self.upload_queue.empty()
