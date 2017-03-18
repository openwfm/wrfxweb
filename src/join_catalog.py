import json,glob,logging
import os.path as osp



logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

root=osp.abspath('fdds/simulations')
files = glob.glob(osp.join(root,'catalog.json'))
catalog = {}
for f in files:
    catalog.update(json.load(open(f)))
json.dump(catalog, open('catalog', 'w'), indent=1, separators=(',',':'))
    

