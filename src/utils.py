import fcntl, errno, logging, json, os
import os.path as osp

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


class lock():
    """
    Lock file for exclusive access
    """

    def __init__(self,path):
        self.lock_path = path
        logging.info('Initializing lock on %s' % self.lock_path)
        self.lock_file=open(self.lock_path,'wb',0)
        self.locked=False

    def islocked(self):
        return(self.locked)

    def acquire(self):
   
        """
        Block until exclusive lock can be acquired.
        Used before code that should be executed by one process at a time only,
        such as updating the catalog.
        """
        if self.locked:
            logging.warning('lock.acquire: already locked %s' % self.lock_path)
        try:
            fcntl.flock(self.lock_file,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except IOError as e:
            if e.errno == errno.EACCES or e.errno == errno.EAGAIN:
                logging.warning('Waiting for lock on %s' % self.lock_path)
            else:
                logging.error("I/O error %s: %s" % (e.errno, e.strerror))
        fcntl.flock(self.lock_file,fcntl.LOCK_EX)
        logging.info('Acquired lock on %s' % self.lock_path)
        self.locked=True
   
    def release(self):
        if not self.locked:
            logging.warning('lock.release: not yet locked %s' % self.lock_path)
        logging.info('Releasing lock on %s' % self.lock_path)
        fcntl.flock(self.lock_file,fcntl.LOCK_UN)
        self.locked=False

def update_nested_dict(d,u,level=0):
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

    # print ('update_nested_dict: level %s entering with d=%s u=%s' % (level,d,u))
    if type(d) is not dict or type(u) is not dict:
        raise ValueError ('update_nested_dict: level %s: both arguments must be dictionaries' % level)
    for k in list(u.keys()):
        # print ('update_nested_dict: level %s found key %s in u' % (level,k))
        if k in d:
            # print ('update_nested_dict: level %s key %s in both u and d' % (level,k))
            # print ('update_nested_dict: level %s recursive update in d=%s and u=%s' % (level,d,u))
            if type(d[k]) is not dict or type(u[k]) is not dict:
                raise ValueError ('update_nested_dict: level %s: values for common key %s must be dictionaries' % (level,k))
            update_nested_dict(d[k],u[k],level+1)
            # print ('update_nested_dict: level %s got updated d=%s' % (level,d))
        else:
            # print ('update_nested_dict: level %s key %s from u not found in d' % (level,k))
            # print ('update_nested_dict: level %s adding item to d=%s from u=%s' % (level,d,u))
            d[k]=u[k]
            # print ('update_nested_dict: level %s got updated d=%s' % (level,d))
    # print ('update_nested_dict: level %s exiting with updated d=%s' % (level,d))


def load_sys_cfg():
    # load the system configuration
    sys_cfg = None
    try:
        sys_cfg = Dict(json.load(open('etc/conf.json')))
    except IOError:
        logging.critical('Cannot find system configuration, have you created etc/conf.json?')
        sys.exit(2)
    # set defaults
    sys = sys_cfg.sys_install_path = sys_cfg.get('sys_install_path',os.getcwd())
    return sys_cfg

