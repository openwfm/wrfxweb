from dotenv import load_dotenv
import os

load_dotenv()


TASK_QUEUE_SERVICE_SECRET = os.getenv("TASK_QUEUE_SERVICE_SECRET")
TASK_QUEUE_SERVICE_QUEUE = os.getenv("TASK_QUEUE_SERVICE_QUEUE")
TASK_QUEUE_SERVICE_LOG = os.getenv("TASK_QUEUE_SERVICE_LOG")
