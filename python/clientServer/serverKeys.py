from dotenv import load_dotenv
import os

load_dotenv()

CLIENT_SERVER_SECRET = os.getenv("CLIENT_SERVER_SECRET")
API_URL = os.getenv("API_URL")
LOG_FILE = os.getenv("LOG_FILE")
CLIENT_SECRETS_FILE = os.getenv("CLIENT_SECRETS_FILE")
OAUTH_SCOPES = os.getenv("OAUTH_SCOPES", "").split(" ")
DEBUG_LOGS = os.getenv("DEBUG_LOGS")
