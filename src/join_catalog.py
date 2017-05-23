import json,glob,logging
import os.path as osp
import collections
from utils import lock


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

root=osp.abspath('fdds/simulations')
files = glob.glob(osp.join(root,'*/catalog.json'))
catalog_path=osp.join(root,'catalog.json')
lock_path=catalog_path + '.lock'

catalog = {}
for f in files:
    catalog.update(json.load(open(f)))

# add blank fields if not present
for i in catalog:
    catalog[i]['processed_utc']=catalog[i].get('processed_utc',None)
    catalog[i]['run_utc']=catalog[i].get('run_utc',None)
    catalog[i]['kml_url']=catalog[i].get('kml_url',None)
    catalog[i]['kml_size']=catalog[i].get('kml_size',None)
    catalog[i]['job_id']=i

catalog_sorted=collections.OrderedDict(sorted(catalog.items(), reverse=True))

l=lock(lock_path)
l.acquire()
json.dump(catalog_sorted, open(catalog_path, 'w'), indent=1, separators=(',',':'))
l.release()

logging.info('Created catalog at %s',catalog_path)
    

