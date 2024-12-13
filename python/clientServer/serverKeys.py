from dotenv import load_dotenv
import os

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
CLIENT_SERVER_SECRET = os.getenv("CLIENT_SERVER_SECRET")
OAUTH_REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
LOG_FILE = os.getenv("LOG_FILE")
