from dotenv import load_dotenv
import os

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
CLIENT_SERVER_SECRET = os.getenv("CLIENT_SERVER_SECRET")
OAUTH_REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI")
ENVIRONMENT = os.getenv("ENVIRONMENT")
API_URL = os.getenv("API_URL")
