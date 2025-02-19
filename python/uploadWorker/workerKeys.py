from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

UPLOAD_WORKER_SECRET = os.getenv("UPLOAD_WORKER_SECRET")
UPLOAD_WORKER_LOG = os.getenv("UPLOAD_WORKER_LOG")
UPLOAD_WORKER_DEBUG_LOGS = os.getenv("UPLOAD_WORKER_DEBUG_LOGS")
UPLOAD_WORKER_API_KEY = os.getenv("UPLOAD_WORKER_API_KEY")
UPLOAD_QUEUE_SERVICE_API_KEY = os.getenv("UPLOAD_QUEUE_SERVICE_API_KEY")
UPLOAD_QUEUE_SERVICE_URL = os.getenv("UPLOAD_QUEUE_SERVICE_URL")
