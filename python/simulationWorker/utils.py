import zipfile
import os

import os

UPLOAD_EXTENSIONS = [".json", ".png", ".kmz"]


def validate_zip_upload(catalog_entry_upload):
    upload_path = catalog_entry_upload.upload_path()
    if not valid_zip_upload(upload_path):
        os.remove(upload_path)
        catalog_entry_upload.destroy()


def valid_zip_upload(upload_path):
    try:
        with zipfile.ZipFile(upload_path) as zip_ref:
            zip_ref.testzip()
            for file_name in zip_ref.namelist():
                file_ext = os.path.splitext(file_name)[1]
                if file_ext not in UPLOAD_EXTENSIONS:
                    return False
        return True
    except zipfile.BadZipFile:
        return False
