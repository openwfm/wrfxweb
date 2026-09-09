from api.services import CatalogServices as CatalogServices
from datetime import datetime, UTC, timedelta
from clientServer.routes.wrfxctrl.utils import to_esmf, to_utc


DATETIME_FORMAT = "%b %d, %Y %I:%M %p"
DEFAULT_DOMAIN_CENTER = [37, -121]
DEFAULT_DESCRIPTION = "default description"
DEFAULT_PROFILE = "1d-1km-HRRR"

JOB_JSON_TEMPLATE = {
    "description": DEFAULT_DESCRIPTION,
    "ignition_start": "",
    "ignition_end": "",
    # "cycle_start_utc": "",
    "ignition_type": "1",
    "ignition_latitude": DEFAULT_DOMAIN_CENTER[0],
    "ignition_longitude": DEFAULT_DOMAIN_CENTER[1],
    "ignition_time": "",
    "domain": "Single domain",
    "profile": DEFAULT_PROFILE,
    "iofields": "false",
    "use_realtime": "false",
    "ignition_perimeter_lats": "[]",
    "ignition_perimeter_lons": "[]",
    "start_utc": "",
    "end_utc": "",
    "ignition_line_lats": "[]",
    "ignition_line_lons": "[]",
    "ignition_line_ignition_times": "[]",
    "ignition_line_fc_hours": "[]",
    "multiple_ignitions_lats": f"[{DEFAULT_DOMAIN_CENTER[0]}]",
    "multiple_ignitions_lons": f"[{DEFAULT_DOMAIN_CENTER[1]}]",
    "multiple_ignitions_ignition_times": "",
    "multiple_ignitions_fc_hours": "[0]",
    "domain_center_lat": DEFAULT_DOMAIN_CENTER[0],
    "domain_center_lon": DEFAULT_DOMAIN_CENTER[1],
}


def default_now():
    datetime_now = datetime.now(UTC)
    return datetime_now.strftime(DATETIME_FORMAT)


def default_an_hour_from_now():
    datetime_now = datetime.now(UTC)
    return (datetime_now + timedelta(hours=1)).strftime(DATETIME_FORMAT)


def generate_sim_id():
    now = datetime.utcnow()
    job_id = "from-web-%04d-%02d-%02d_%02d-%02d-%02d" % (
        now.year,
        now.month,
        now.day,
        now.hour,
        now.minute,
        now.second,
    )
    return job_id


def generate_job_id(sim_id, start_utc, end_utc):
    start_utc = to_utc(to_esmf(datetime.strptime(start_utc, DATETIME_FORMAT)))
    end_utc = to_utc(to_esmf(datetime.strptime(end_utc, DATETIME_FORMAT)))

    return "wfc-%s-%s-%s" % (sim_id, to_esmf(start_utc), to_esmf(end_utc))


def default_job_json():
    job_json = JOB_JSON_TEMPLATE.copy()

    job_json["ignition_start"] = default_now()
    job_json["ignition_end"] = default_an_hour_from_now()
    # job_json["cycle_start"] = default_now()
    job_json["ignition_time"] = default_now()
    job_json["start_utc"] = default_now()
    job_json["end_utc"] = default_an_hour_from_now()
    job_json["multiple_ignitions_ignition_times"] = (f'["{default_now()}"]',)

    return job_json


def validate_date(date_text):
    datetime_conversion = datetime.strptime(date_text, DATETIME_FORMAT)
    return datetime_conversion.strftime(DATETIME_FORMAT)


def validate_lat_lon(lat, lon):
    return [float(lat), float(lon)]


def validate_string(user_string):
    if not isinstance(user_string, str):
        raise ValueError("User Input must be a string")
    if len(user_string) > 30:
        raise ValueError("User Input must be a string shorter than 30 characters")
    return user_string


def validate_catalog_id(catalog_id, user):
    catalog = CatalogServices.find_by_id(catalog_id)
    if catalog == None:
        raise ValueError(f"catalog_id {catalog_id} must be a valid Catalog")
    if catalog.public:
        raise ValueError(f"Catalog {catalog_id} is public")
    if not CatalogServices.user_has_access(catalog_id, user):
        raise ValueError(
            f"catalog_id {catalog_id} must be a Catalog user has access to"
        )
    return catalog_id


def validate_job_json(job_json, user):
    validated_job_json = default_job_json()

    validated_job_json["description"] = validate_string(job_json["description"])
    validated_job_json["ignition_start"] = validate_date(job_json["ignition_start"])
    validated_job_json["ignition_end"] = validate_date(job_json["ignition_end"])
    validated_job_json["catalog_id"] = validate_catalog_id(job_json["catalog_id"], user)

    valid_ign_lat, valid_ign_lon = validate_lat_lon(
        job_json["ignition_latitude"], job_json["ignition_longitude"]
    )
    valid_ign_time = validate_date(job_json["ignition_time"])
    validated_job_json["ignition_latitude"] = valid_ign_lat
    validated_job_json["ignition_longitude"] = valid_ign_lon
    validated_job_json["ignition_time"] = valid_ign_time

    start_utc = validate_date(job_json["start_utc"])
    end_utc = validate_date(job_json["end_utc"])
    validated_job_json["start_utc"] = start_utc
    validated_job_json["end_utc"] = end_utc

    validated_job_json["multiple_ignitions_ignition_times"] = f'["{valid_ign_time}"]'
    validated_job_json["multiple_ignitions_lats"] = f"[{valid_ign_lat}]"
    validated_job_json["multiple_ignitions_lons"] = f"[{valid_ign_lon}]"

    domain_lat, domain_lon = validate_lat_lon(
        job_json["ignition_latitude"], job_json["ignition_longitude"]
    )
    validated_job_json["domain_center_lat"] = domain_lat
    validated_job_json["domain_center_lon"] = domain_lon

    sim_id = generate_sim_id()
    validated_job_json["sim_id"] = sim_id
    validated_job_json["job_id"] = generate_job_id(sim_id, start_utc, end_utc)
    validated_job_json["profile"] = validate_string(job_json["profile"])

    return validated_job_json
