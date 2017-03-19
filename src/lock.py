import fcntl
import errno
import logging

class lock():

    def __init__(self,path):
        self.lock_path = path
        logging.info('Initializing lock on %s' % self.lock_path)
        self.lock_file=open(self.lock_path,'w',0)
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
