from dotenv import load_dotenv
import os

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
CLIENT_SERVER_SECRET = os.getenv("CLIENT_SERVER_SECRET")
OAUTH_REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI")
API_URL = os.getenv("API_URL")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
LOG_FILE = os.getenv("LOG_FILE")
CLIENT_SECRETS_FILE = os.getenv("CLIENT_SECRETS_FILE")
OAUTH_SCOPES = ["openid", "https://www.googleapis.com/auth/userinfo.email"]
