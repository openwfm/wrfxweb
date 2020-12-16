from __future__ import absolute_import
from __future__ import print_function
import json,os
import os.path as osp

# a simple script to distribute pieces of catalog to simulation directories

simulations_path = osp.abspath('fdds/simulations')
catalog_path = osp.join(simulations_path,'catalog.json')
print('reading %s' % catalog_path)
catalog = json.load(open(catalog_path,'r'))

for sim in catalog:
    local_catalog_path = osp.join(simulations_path,sim,'catalog.json')
    print('writing %s' % local_catalog_path)
    json.dump({sim: catalog[sim]},open(local_catalog_path,'w'),indent=4, separators=(',', ': '))


