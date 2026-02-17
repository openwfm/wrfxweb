from dotenv import load_dotenv
import os


load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

SIMULATIONS_FOLDER = os.getenv("SIMULATIONS_FOLDER", "")
CATALOG_FILENAME = os.getenv("CATALOG_FILENAME", "")
WRFXWEB_SIMULATIONS_URL = os.getenv("WRFXWEB_SIMULATIONS_URL", "")

FM_JOB_IDS = [
    fm_job_id for fm_job_id in os.getenv("FM_JOB_IDS", "").split(",") if fm_job_id
]
LIDAR_JOB_ID = os.getenv("LIDAR_JOB_ID", "")
