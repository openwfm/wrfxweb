from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

UPLOAD_WORKER_API_KEY = os.getenv("UPLOAD_WORKER_API_KEY")
