from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

ADMIN_SERVICES_API_KEY = os.getenv("ADMIN_SERVICES_API_KEY")
UPLOADS_FOLDER = os.getenv("UPLOADS_FOLDER")
TEMP_FOLDER = os.getenv("TEMP_FOLDER", "")
SIMULATIONS_FOLDER = os.getenv("SIMULATIONS_FOLDER", "")
