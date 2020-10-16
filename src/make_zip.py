import os.path as osp
import glob
import json
import sys
import logging
from utils import load_sys_cfg
import posixpath as pxp
import requests
import subprocess

sys_cfg = load_sys_cfg()
sys_cfg.sims_path = 'fdds/simulations'
sys_cfg.sims_url_path = 'simulations'

def make_zip(job_id):
    """
    Create ZIP file from visualization stored in wrfxweb.
    :param job_id: string, the name of job directory
    """

    logging.info('make_zip: job_id=%s' % job_id)
    job_path = osp.join(osp.abspath(sys_cfg.sims_path),job_id)
    url_prefix = pxp.join(sys_cfg.url_root,sys_cfg.sims_url_path,job_id)
    logging.debug('make_zip: job_path %s' % job_path)
    logging.debug('make_zip: url_prefix %s' % url_prefix)

    # read the catalog and the manifest
    cat_path = osp.join(job_path,'catalog.json')
    cat = json.load(open(cat_path))
    if job_id not in cat:
         logging.error('job id %s not in the catalog' % job_id)
         sys.exit(1)
    cat_entry = cat[job_id]
    mf = json.load(open(osp.join(sys_cfg.sims_path,cat_entry['manifest_path'])))

    paths = [fn for fn in glob.glob(osp.join(job_path,'*.csv'))]
    logging.info('make_zip: files to compress %s' % paths)
    
    description = cat_entry['description']
    logging.info('make_zip: job description: %s' % description)
    
    # build output file
    zip_filename = job_id + '.zip'
    zip_path = osp.join(job_path,zip_filename)
    logging.info('make_zip: creating file %s' % zip_path) 
    command = ['zip -jr', zip_path] + paths
    logging.info('make_zip: command - %s' % ' '.join(command))
    subprocess.call(' '.join(command),shell=True)
    url = pxp.join(url_prefix,zip_filename)
    logging.info('make_zip: file created at %s' % url) 
    try:
        r = requests.get(url, stream=True)
        content_size = int(r.headers['Content-Length'])
        logging.info('make_zip: file size is %s' % content_size) 
        cat[job_id]['zip_url']=url
        cat[job_id]['zip_size']=content_size
        json.dump(cat, open(cat_path,'w'), indent=4, separators=(',', ': '))
    except:
        logging.warning('make_zip: accessing the file over the web failed') 
       
                 
if __name__ == '__main__':

    sys.argv

    if len(sys.argv) != 2:
        print('usage: make_zip.sh job_id')
        print('job_id: the name of job directory in ' + sys_cfg.sims_path)
        sys.exit(1)

    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    job_id = sys.argv[1]
    make_zip(job_id)

