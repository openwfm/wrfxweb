from clientServer.serverKeys import WRFXCTRL_CLUSTER
from clientServer.routes.wrfxctrl.utils import load_profiles, load_sys_cfg
from clientServer.routes.wrfxctrl.cluster import Cluster


import json

profiles = load_profiles()
cluster = Cluster(json.load(open(WRFXCTRL_CLUSTER)))
conf = load_sys_cfg()
sims_path = conf["sims_path"]
