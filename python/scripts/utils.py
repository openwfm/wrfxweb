import api.services.CatalogEntryServices as CatalogEntryServices

import fcntl, errno, logging


def create_catalog_entries(catalog_entry_jsons, entry_type):
    for job_id in catalog_entry_jsons:
        catalog_entry_json = catalog_entry_jsons[job_id]
        catalog_entry_json["processed_utc"] = catalog_entry_jsons[job_id].get(
            "processed_utc", None
        )
        catalog_entry_json["run_utc"] = catalog_entry_jsons[job_id].get("run_utc", None)

        catalog_entry_json["kml_url"] = catalog_entry_jsons[job_id].get("kml_url", None)
        catalog_entry_json["kml_size"] = catalog_entry_jsons[job_id].get(
            "kml_size", None
        )
        catalog_entry_json["zip_url"] = catalog_entry_jsons[job_id].get("zip_url", None)
        catalog_entry_json["zip_size"] = catalog_entry_jsons[job_id].get(
            "zip_size", None
        )
        catalog_entry_json["job_id"] = job_id
        catalog_entry_json["uploader_id"] = 0
        catalog_entry_json["entry_type"] = entry_type

        catalog_entry = CatalogEntryServices.find_or_create(catalog_entry_json)
        if catalog_entry == None:
            print(f"failed to create CatalogEntry for {job_id}")
            return None
        else:
            print(f"created <CatalogEntry {catalog_entry.id}> for {job_id}")
            return catalog_entry


class Dict(dict):
    """
    A dictionary that allows member access to its keys.
    A convenience class.
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


class lock:
    """
    Lock file for exclusive access
    """

    def __init__(self, path):
        self.lock_path = path
        logging.info("Initializing lock on %s" % self.lock_path)
        self.lock_file = open(self.lock_path, "w")
        self.locked = False

    def islocked(self):
        return self.locked

    def acquire(self):
        """
        Block until exclusive lock can be acquired.
        Used before code that should be executed by one process at a time only,
        such as updating the catalog.
        """
        if self.locked:
            logging.warning("lock.acquire: already locked %s" % self.lock_path)
        try:
            fcntl.flock(self.lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except IOError as e:
            if e.errno == errno.EACCES or e.errno == errno.EAGAIN:
                logging.warning("Waiting for lock on %s" % self.lock_path)
            else:
                logging.error("I/O error %s: %s" % (e.errno, e.strerror))
        fcntl.flock(self.lock_file, fcntl.LOCK_EX)
        logging.info("Acquired lock on %s" % self.lock_path)
        self.locked = True

    def release(self):
        if not self.locked:
            logging.warning("lock.release: not yet locked %s" % self.lock_path)
        logging.info("Releasing lock on %s" % self.lock_path)
        fcntl.flock(self.lock_file, fcntl.LOCK_UN)
        self.locked = False


def update_nested_dict(d, u, level=0):
    """
    Recursively update nested dictionary. Does not overwrite any values.
    Identical key is allowed only if both values are dictionaries and the
    update can continue recursively.

    :param d: update: dictionary to be updated
    :param u: input: dictionary with the update

    :param level: internal, for error reporting only
    :param key: internal, for error reporting only

    Example:
    from utils import update_nested_dict
    d = {1: {2: 3}, 2: {4: 5}}
    u = {1: {8: 9}, 3: {10: 11}}
    update_nested_dict(d,u)
    d
    {1: {8: 9, 2: 3}, 2: {4: 5}, 3: {10: 11}}
    update_nested_dict(d,u)
    ValueError: update_nested_dict: level 1: values for common key 8 must be dictionaries
    """

    if type(d) is not dict or type(u) is not dict:
        raise ValueError(
            "update_nested_dict: level %s: both arguments must be dictionaries" % level
        )
    for k in u.keys():
        if k in d:
            if type(d[k]) is not dict or type(u[k]) is not dict:
                raise ValueError(
                    "update_nested_dict: level %s: values for common key %s must be dictionaries"
                    % (level, k)
                )
            update_nested_dict(d[k], u[k], level + 1)
        else:
            d[k] = u[k]
