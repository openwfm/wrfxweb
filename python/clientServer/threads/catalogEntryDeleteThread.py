from clientServer.app import app
from clientServer.threads.threadQueue import ThreadQueue
from clientServer.serverKeys import ADMIN_SERVICES_API_KEY
import api.services.CatalogEntryServices as CatalogEntryServices


import threading


class CatalogEntryDeleteThread:
    def __init__(self, delete_queue):
        self.thread = None
        self.delete_queue = delete_queue

    def ready(self):
        return self.thread == None or not self.thread.is_alive()

    def start(self):
        self.thread = threading.Thread(target=self.process_fmda_files, args=[])
        self.thread.start()

    def process_fmda_files(self):
        with app.app_context():
            while not self.delete_queue.empty():
                catalog_entry_id = self.delete_queue.get()
                CatalogEntryServices.delete_by_id(
                    catalog_entry_id, ADMIN_SERVICES_API_KEY
                )


catalog_entry_delete_queue = ThreadQueue()
catalog_entry_delete_thread = CatalogEntryDeleteThread(catalog_entry_delete_queue)
