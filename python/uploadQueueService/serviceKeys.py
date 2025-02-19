from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

UPLOAD_QUEUE_SERVICE_SECRET = os.getenv("UPLOAD_QUEUE_SERVICE_SECRET")
UPLOAD_QUEUE_SERVICE_QUEUE = os.getenv("UPLOAD_QUEUE_SERVICE_QUEUE", "")
UPLOAD_QUEUE_SERVICE_LOG = os.getenv("UPLOAD_QUEUE_SERVICE_LOG")
UPLOAD_QUEUE_SERVICE_DEBUG_LOGS = os.getenv("UPLOAD_QUEUE_SERVICE_DEBUG_LOGS")
UPLOAD_QUEUE_SERVICE_API_KEY = os.getenv("UPLOAD_QUEUE_SERVICE_API_KEY")
CLIENT_SERVER_API_KEY = os.getenv("CLIENT_SERVER_API_KEY")
UPLOAD_WORKER_URL = os.getenv("UPLOAD_WORKER_URL")
UPLOAD_WORKER_API_KEY = os.getenv("UPLOAD_WORKER_API_KEY")
