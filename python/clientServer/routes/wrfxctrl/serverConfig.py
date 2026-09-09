from utils import load_profiles, load_sys_cfg
from cluster import Cluster
import glob
import json
import logging
import os


def load_simulations(sims_path):
    """
    Load all simulations stored in the simulations/ directory.

    :params sims_path: path to jsons with simulation states
    :return: a dictionary of simulations
    """

    logging.info("Loading simulation states from %s" % sims_path)
    files = glob.glob(sims_path + "/*.json")
    simulations = {}
    for f in files:
        logging.info("load_simulations: loading file %s" % f)
        try:
            sim_info = json.load(open(f))
            if "job_id" not in sim_info:
                # older files do not have job_id, redo from the visualization link
                link = sim_info["visualization_link"]
                sim_info["job_id"] = link[link.find("wfc-") :]
                logging.debug("Added missing job_id " + sim_info["job_id"])
            sim_id = sim_info["id"]
            simulations[sim_id] = sim_info
            logging.info("load_simulations: loaded simulation id %s" % sim_id)
        except ValueError:
            logging.error("load_simulations: failed to reload simulation %s" % f)
            os.rename(f, f + ".error")
    return simulations


profiles = load_profiles()
cluster = Cluster(json.load(open("etc/cluster.json")))
conf = load_sys_cfg()
sims_path = conf["sims_path"]
simulations = load_simulations(sims_path)
