# Copyright (C) 2013-2016 Martin Vejmelka, UC Denver
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
# of the Software, and to permit persons to whom the Software is furnished to do
# so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR
# A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
from clientServer.serverKeys import WRFXCTRL_PROFILES, WRFXCTRL_CONF
from api.services import CatalogServices as CatalogServices

import json
from datetime import datetime
import pytz
import logging
import os
import os.path as osp
from lxml import etree


class Dict(dict):
    """
    A dictionary that allows member access to its keys.
    """

    def __init__(self, d):
        """
        Updates itself with d.
        """
        self.update(d)

    def __getattr__(self, item):
        return self[item]

    def __setattr__(self, item, value):
        self[item] = value


def load_profiles():
    """
    Load information on job profiles available to users.

    :return: a dict keyed by profile id containing Dicts with profile info
    """
    profs = json.load(open(WRFXCTRL_PROFILES))
    return {name: Dict(p) for name, p in profs.items()}


def to_esmf(ts):
    """
    Convert a UTC datetime into a ESMF string.

    :param ts: the datetime object
    :return: the date time in ESMF format
    """
    return "%04d-%02d-%02d_%02d:%02d:%02d" % (
        ts.year,
        ts.month,
        ts.day,
        ts.hour,
        ts.minute,
        ts.second,
    )


def to_utc(esmf):
    """
    Parse and convert an ESMF datetime into a datetime in UTC.

    :param esmf: the ESMF string YYYY-MM-DD_hh:mm:ss
    :return: a datetime in the UTC timezone
    """
    year, mon, day = int(esmf[0:4]), int(esmf[5:7]), int(esmf[8:10])
    hour, min, sec = int(esmf[11:13]), int(esmf[14:16]), int(esmf[17:19])
    return datetime(year, mon, day, hour, min, sec, tzinfo=pytz.utc)


def rm(paths):
    """
    Try to remove a file.

    :param path: list of file paths
    :return: 'OK', otherwise error
    """
    for f in paths:
        logging.debug("Deleting %s" % f)
        try:
            os.remove(f)
            logging.info("Deleted %s" % f)
        except OSError as err:
            logging.error("Cannot delete %s: %s" % (f, err.strerror))


def load_sys_cfg():
    # load the system configuration
    sys_cfg = None
    try:
        sys_cfg = Dict(json.load(open(WRFXCTRL_CONF)))
    except IOError:
        logging.critical(
            "Cannot find system configuration, have you created etc/conf.json?"
        )
        return {}
    # set defaults
    sys = sys_cfg.sys_install_path = sys_cfg.get("sys_install_path", os.getcwd())
    sys_cfg.jobs_path = sys_cfg.get("jobs_path", osp.join(sys, "jobs"))
    sys_cfg.logs_path = sys_cfg.get("logs_path", osp.join(sys, "logs"))
    sys_cfg.sims_path = sys_cfg.get("sims_path", osp.join(sys, "simulations"))

    return sys_cfg


def parse_kml(kml_data, kml_object):
    # create XML parser
    parser = etree.XMLParser(recover=True, remove_blank_text=True)
    # parse the file as a tree element
    root = etree.fromstring(kml_data, parser=parser)
    # get namespace map that each tag is going to contain
    nsmap = root.nsmap.get("kml", root.nsmap.get(None))
    # create xpath lambda function to generate paths to elements with the namespace map
    xpath = lambda tag: (
        ".//{{{}}}{}".format(nsmap, tag) if nsmap else ".//{}".format(tag)
    )
    # get all the Placemarks
    results = []
    # loop all the placemarks
    for pm in root.iterfind(xpath("Placemark")):
        # loop all the polygons
        for pp in pm.iterfind(xpath(kml_object)):
            # TODO: add multiple outer boundaries (JS only allows one boundary for now)
            # get the outer boundary coordinates
            try:
                out_elem = pp.find(xpath("outerBoundaryIs")).find(xpath("coordinates"))
            except:
                out_elem = pp.find(xpath("coordinates"))
            # append outer boundaries to general array cleaning blank spaces
            results += [
                {
                    "lat": float(coord.strip().split(",")[1].strip()),
                    "lon": float(coord.strip().split(",")[0].strip()),
                    "ign_time": None,
                }
                for coord in out_elem.text.strip().split(" ")
                if coord.strip() != ""
            ]
            # TODO: add inner boundaries (JS only allows one boundary for now)
    return results


def str_to_bool(s: str) -> bool:
    return s.strip().lower() == "true"


DATETIME_FORMAT = "%b %d, %Y %I:%M %p"


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
    validated_job_json = {}

    validated_job_json["description"] = validate_string(job_json["description"])
    validated_job_json["ignition_start"] = validate_date(job_json["ignition_start"])
    validated_job_json["ignition_end"] = validate_date(job_json["ignition_end"])

    valid_ign_lat, valid_ign_lon = validate_lat_lon(
        job_json["ignition_latitude"], job_json["ignition_longitude"]
    )
    validated_job_json["ignition_latitude"] = valid_ign_lat
    validated_job_json["ignition_longitude"] = valid_ign_lon

    valid_ign_time = validate_date(job_json["ignition_time"])
    validated_job_json["ignition_time"] = valid_ign_time

    validated_job_json["start_utc"] = validate_date(job_json["start_utc"])
    validated_job_json["end_utc"] = validate_date(job_json["end_utc"])

    domain_lat, domain_lon = validate_lat_lon(
        job_json["ignition_latitude"], job_json["ignition_longitude"]
    )
    validated_job_json["domain_center_lat"] = domain_lat
    validated_job_json["domain_center_lon"] = domain_lon
    validated_job_json["catalog_id"] = validate_catalog_id(job_json["catalog_id"], user)

    return validated_job_json
