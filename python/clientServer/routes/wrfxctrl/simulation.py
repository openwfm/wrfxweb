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
#

from __future__ import absolute_import
from __future__ import print_function
from clientServer.routes.wrfxctrl.utils import to_esmf, to_utc, rm, str_to_bool
from datetime import datetime, timedelta
import numpy as np
import pytz
import json
import os
import os.path as osp
import stat
import subprocess
import glob
import logging
import simplekml


def select_grib_source(start_time):
    now = datetime.utcnow().replace(tzinfo=pytz.UTC)
    if now - start_time < timedelta(days=30):
        return "NAM"
    else:
        return "NARR"


def simulation_paths(sim_id, conf):
    """
    Get paths to simulation files.

    :param sim_id: the simulation id
    :param conf: configuration
    """
    return {
        "log_path": conf["logs_path"] + "/" + sim_id + ".log",
        "json_path": conf["jobs_path"] + "/" + sim_id + ".json",
        "state_path": conf["sims_path"] + "/" + sim_id + ".json",
        "run_script": conf["jobs_path"] + "/" + sim_id + ".sh",
        "kml_path": conf["jobs_path"] + "/" + sim_id + ".kml",
    }


def cancel_simulation(sim_info, conf):
    """
    Cancel simulation job. Do not delete files.
    :param sim_info: the simulation json
    :param conf: configuration
    """
    cmd = osp.abspath(osp.join(conf["wrfxpy_path"], "cleanup.sh"))
    job_id = sim_info["job_id"]
    exe = [cmd, "cancel", job_id]
    logging.debug("Calling " + " ".join(exe))
    out = subprocess.check_output(exe)
    logging.info(out)

    paths = simulation_paths(sim_info["id"], conf)
    log_path = paths["log_path"]
    with open(log_path, "wb") as f:
        f.write(out)
        f.write(b"Cancelled")


def cleanup_free_nodes(conf):
    qinfo_cmd = conf.get("qinfo_cmd", "sinfo")
    try:
        ret = subprocess.check_output(
            [qinfo_cmd, "-h", "-N", "-o", "%N %T"],
            stderr=subprocess.STDOUT,
            text=True,  # returns str; no .decode() needed
        )
    except subprocess.CalledProcessError as e:
        logging.error(e.output)
    seen = set()
    count = 0
    for line in ret.splitlines():
        if not line.strip():
            continue
        # line like: "<nodeName> <State>"
        parts = line.split()
        name = parts[0]
        state = parts[1].lower()
        if name in seen:
            continue  # dedupe across partitions
        seen.add(name)
        if state.startswith("idle"):
            count += 1
    logging.info(f"{count} available nodes in the cluster")
    return count


def cleanup_sim_output(sim_info, conf):
    """Cleanup simulation output.
    :param sim_info: the simulation json
    :param conf: configuration
    """
    cmd = osp.abspath(osp.join(conf["wrfxpy_path"], "cleanup.sh"))
    job_id = sim_info["job_id"]
    exe = [cmd, "output", job_id]
    logging.debug("Calling " + " ".join(exe))
    os.system(" ".join(exe))


def cleanup_sim_workspace(sim_info, conf):
    """Cleanup simulation workspace.
    :param sim_info: the simulation json
    :param conf: configuration
    """
    cmd = osp.abspath(osp.join(conf["wrfxpy_path"], "cleanup.sh"))
    job_id = sim_info["job_id"]
    exe = [cmd, "workspace", job_id]
    logging.debug("Calling " + " ".join(exe))
    os.system(" ".join(exe))


def delete_simulation(sim_info, conf):
    """
    Delete simulation from wrfxpy and all files.
    :param sim_info: the simulation json
    :param conf: configuration
    """
    cmd = osp.abspath(osp.join(conf["wrfxpy_path"], "cleanup.sh"))
    job_id = sim_info["job_id"]
    exe = [cmd, "all", job_id]
    logging.debug("Calling " + " ".join(exe))
    os.system(" ".join(exe))
    delete_simulation_files(sim_info["id"], conf)


def delete_simulation_files(sim_id, conf):
    """
    Remove all files for given simulation.
    :param sim_id: the simulation id
    :param conf: configuration
    """
    rm(list(simulation_paths(sim_id, conf).values()))


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


def rerun_simulation(sim_id, conf):
    try:
        path = simulation_paths(sim_id, conf)
        run_script = path["run_script"]

        log_path = path["log_path"]
        now = datetime.utcnow()
        archived_sim_id = "-archived-%04d-%02d-%02d_%02d-%02d-%02d" % (
            now.year,
            now.month,
            now.day,
            now.hour,
            now.minute,
            now.second,
        )
        archive_log_path = conf["logs_path"] + "/" + sim_id + archived_sim_id + ".log"
        os.rename(log_path, archive_log_path)

        proc = subprocess.Popen(
            run_script, shell=True, stdin=None, stdout=None, stderr=None, close_fds=True
        )
    except:
        logging.error("Rerunning simulation for sim id %s failed" % sim_id)


def create_simulation(info, conf, cluster):
    """
    Build a simulation JSON configuration based on profiles and execute
    the simulation using wrfxpy.

    :param info: the simulation info gathered from the build page
    :param conf: configuration
    :param cluster: a cluster object that conveys information about the computing environment
    :return: the simulation info object
    """
    now = datetime.utcnow()
    sim_id = "from-web-%04d-%02d-%02d_%02d-%02d-%02d" % (
        now.year,
        now.month,
        now.day,
        now.hour,
        now.minute,
        now.second,
    )

    # get paths of all files created
    path = simulation_paths(sim_id, conf)
    log_path = path["log_path"]
    json_path = path["json_path"]
    run_script = path["run_script"]

    # store simulation configuration
    profile = info["profile"]
    print("profile = %s" % json.dumps(profile, indent=4, separators=(",", ": ")))
    sim_descr = info["description"]
    sim_info = {
        "id": sim_id,
        "started_at": to_esmf(datetime.now()),
        "description": sim_descr,
        "profile": info["profile"],
        "log_file": log_path,
        "state": make_initial_state(),
        "iofields": str_to_bool(info["iofields"]),
        "use_realtime": str_to_bool(info["use_realtime"]),
        "use_tign_ignition": False,
    }

    # build a new job template
    template = osp.abspath(profile["template"])
    cfg = json.load(open(template))
    print("Job template %s:" % template)
    print(json.dumps(cfg, indent=4, separators=(",", ": ")))

    if "fmda_geogrid_path" in info:
        geogrid_path = osp.join(conf["geogrid_root"], info["fmda_geogrid_path"])
        if osp.exists(geogrid_path):
            sim_info["fmda_geogrid_path"] = geogrid_path
            cfg["fmda_geogrid_path"] = geogrid_path

    cfg["iofields"] = str_to_bool(info["iofields"])
    cfg["use_realtime"] = str_to_bool(info["use_realtime"])
    cfg["use_tign_ignition"] = sim_info["use_tign_ignition"]
    cfg["template"] = template
    cfg["profile"] = profile
    cfg["grid_code"] = sim_id
    cfg["num_nodes"] = np.floor(cfg["num_nodes"] * cfg["ppn"] / cluster.ppn)
    cfg["ppn"] = cluster.ppn
    sim_start = to_esmf(datetime.strptime(info["start_utc"], "%b %d, %Y %I:%M %p"))
    start_utc = to_utc(
        to_esmf(datetime.strptime(info["start_utc"], "%b %d, %Y %I:%M %p"))
    )
    sim_end = to_esmf(datetime.strptime(info["end_utc"], "%b %d, %Y %I:%M %p"))
    end_utc = to_utc(to_esmf(datetime.strptime(info["end_utc"], "%b %d, %Y %I:%M %p")))

    sim_info["start_utc"] = sim_start
    cfg["start_utc"] = sim_start
    sim_info["end_utc"] = sim_end
    cfg["end_utc"] = sim_end

    if "cycle_start_utc" in info:
        cycle_start = to_esmf(
            datetime.strptime(info["cycle_start_utc"], "%b %d, %Y %I:%M %p")
        )
        sim_info["cycle_start_utc"] = cycle_start
        cfg["cycle_start_utc"] = cycle_start

    if "grib_source" not in cfg or cfg["grib_source"] == "auto":
        cfg["grib_source"] = select_grib_source(start_utc)
        print(
            "GRIB source not specified, selected %s from sim start time"
            % cfg["grib_source"]
        )
    else:
        print(
            "Using GRIB source %s from %s" % (cfg["grib_source"], profile["template"])
        )

    # build wrfpy_id and the visualization link
    job_id = "wfc-%s-%s-%s" % (sim_id, to_esmf(start_utc), to_esmf(end_utc))
    sim_info["job_id"] = job_id
    sim_info["visualization_link"] = osp.join(conf["wrfxweb_url"], "?job_id=" + job_id)
    cfg["job_id"] = job_id

    # place top-level domain
    domain_lat = float(info["domain_center_lat"])
    domain_lon = float(info["domain_center_lon"])
    cfg["domains"]["1"]["truelats"] = [domain_lat, domain_lat]
    cfg["domains"]["1"]["stand_lon"] = domain_lon
    cfg["domains"]["1"]["center_latlon"] = [domain_lat, domain_lon]

    burn_plot_boundary = []
    if info["ignition_perimeter_lats"] != "[]":
        ign_line_lats = info["ignition_perimeter_lats"][1:-1].split(",")
        ign_line_lons = info["ignition_perimeter_lons"][1:-1].split(",")
        sim_info["ignition_perimeter_lats"] = ign_line_lats
        sim_info["ignition_perimeter_lons"] = ign_line_lons
        for i in range(len(ign_line_lats)):
            ign_line_lat = float(ign_line_lats[i])
            ign_line_lon = float(ign_line_lons[i])
            perimeter = [ign_line_lat, ign_line_lon]
            burn_plot_boundary.append(perimeter)
    cfg["burn_plot_boundary"] = burn_plot_boundary
    if len(burn_plot_boundary):
        sim_info["use_tign_ignition"] = True
        cfg["use_tign_ignition"] = True

    ignitions = []
    # setting the ignitions
    if info["ignition_line_lats"] != "[]":
        ign_line_lats = info["ignition_line_lats"][1:-1].split(",")
        ign_line_lons = info["ignition_line_lons"][1:-1].split(",")
        ign_line_ign_time_esmfs = [
            to_esmf(datetime.strptime(ign_time, "%b %d, %Y %I:%M %p"))
            for ign_time in info["ignition_line_ignition_times"][2:-2].split('","')
        ]
        ign_line_fc_hours = [
            int(fc_hour) for fc_hour in info["ignition_line_fc_hours"][1:-1].split(",")
        ]
        sim_info["ignition_line_lats"] = ign_line_lats
        sim_info["ignition_line_lons"] = ign_line_lons
        sim_info["ignition_line_ignition_times"] = ign_line_ign_time_esmfs
        sim_info["ign_line_fc_hours"] = ign_line_fc_hours
        sim_info["ignition_line_info"] = [
            [float(lat), float(lon), time]
            for lat, lon, time in zip(
                ign_line_lats, ign_line_lons, ign_line_ign_time_esmfs
            )
        ]
        for i in range(len(ign_line_lats)):
            ign_line_lat = float(ign_line_lats[i])
            ign_line_lon = float(ign_line_lons[i])
            ign_line_ign_time_esmf = ign_line_ign_time_esmfs[i]
            ign_line_fc_hour = ign_line_fc_hours[i]
            ignition = {
                "latlon": [ign_line_lat, ign_line_lon],
                "time_utc": ign_line_ign_time_esmf,
                "duration_s": ign_line_fc_hour,
                "line_id": 1,
            }
            ignitions.append(ignition)

    if info["multiple_ignitions_lats"] != "[]":
        ign_lats = info["multiple_ignitions_lats"][1:-1].split(",")
        ign_lons = info["multiple_ignitions_lons"][1:-1].split(",")
        ign_time_esmfs = [
            to_esmf(datetime.strptime(ign_time, "%b %d, %Y %I:%M %p"))
            for ign_time in info["multiple_ignitions_ignition_times"][2:-2].split('","')
        ]
        ign_fc_hours = [
            int(fc_hour)
            for fc_hour in info["multiple_ignitions_fc_hours"][1:-1].split(",")
        ]
        sim_info["multiple_ignition_lats"] = ign_lats
        sim_info["multiple_ignition_lons"] = ign_lons
        sim_info["multiple_ignition_ignition_times"] = ign_time_esmfs
        sim_info["multiple_ignition_fc_hours"] = ign_fc_hours
        sim_info["multiple_ignition_info"] = [
            [float(lat), float(lon), time]
            for lat, lon, time in zip(ign_lats, ign_lons, ign_time_esmfs)
        ]
        for i in range(len(ign_lats)):
            ign_line_lat = float(ign_lats[i])
            ign_line_lon = float(ign_lons[i])
            ign_time_esmf = ign_time_esmfs[i]
            ign_fc_hour = ign_fc_hours[i]
            ignition = {
                "latlon": [ign_line_lat, ign_line_lon],
                "time_utc": ign_time_esmf,
                "duration_s": ign_fc_hour,
            }
            ignitions.append(ignition)

    if len(ignitions):
        domain = list(cfg["ignitions"].keys())[0]
        cfg["ignitions"][domain] = ignitions
    else:
        cfg["ignitions"] = {}

    if len(ignitions) > 1:
        sim_info["use_tign_ignition"] = True
        cfg["use_tign_ignition"] = True

    # switch on sending results to visualization server
    cfg["postproc"]["shuttle"] = "incremental"
    cfg["postproc"]["description"] = sim_descr

    # add fuel moisture if available
    fmda_path = osp.join(
        conf["wrfxpy_path"],
        "wksp_fmda/CONUS",
        start_utc.strftime("%Y%m/fmda-CONUS-%Y%m%d-%H.geo"),
    )
    if osp.exists(fmda_path):
        cfg["fmda_geogrid_path"] = fmda_path

    json.dump(cfg, open(json_path, "w"), indent=4, separators=(",", ": "))

    print("Job configuration %s:" % json_path)
    print("script file %s:" % run_script)
    print(json.dumps(cfg, indent=4, separators=(",", ": ")))

    # drop a shell script that will run the file
    with open(run_script, "w") as f:
        f.write("#!/usr/bin/env bash\n")
        # f.write('/usr/bin/env\n')
        f.write("export PYTHONPATH=src\n")
        f.write("cd " + conf["wrfxpy_path"] + "\n")
        f.write("LOG=" + osp.abspath(log_path) + "\n")
        f.write("nohup ./forecast.sh " + osp.abspath(json_path) + " &> $LOG \n")

    # make it executable
    st = os.stat(run_script)
    os.chmod(run_script, st.st_mode | stat.S_IEXEC)

    # execute the fire forecast and reroute into the log file provided
    print("Running %s" % run_script)
    proc = subprocess.Popen(
        run_script, shell=True, stdin=None, stdout=None, stderr=None, close_fds=True
    )
    print("Ready")

    return sim_info


def write_kml(ign_lat, ign_lon, time, path):
    color = simplekml.Color.red
    kml = simplekml.Kml()
    kml.document.name = "Perimeters"
    multipoly = kml.newmultigeometry(name="PERIM_" + time)
    outer = []
    for n, lat in enumerate(ign_lat):
        outer.append((ign_lon[n], lat))
    multipoly.newpolygon(outerboundaryis=outer)
    multipoly.timestamp.when = time
    polycolor = "00" + color[2:]
    multipoly.style.polystyle.color = polycolor
    multipoly.style.linestyle.color = color
    kml.save(path)
    path


def parse_error(state, line):
    """
    Find the tool that created the error in line and update state.

    :param line: the line that created the error
    :param state: the state dictionary containing state of each tool
    """
    tools = ["geogrid", "ingest", "ungrib", "metgrid", "real", "wrf", "output"]
    for t in tools:
        if t in line.lower() or state[t] in ["waiting", "running"]:
            state[t] = "failed"
            return


def parse_time(line):
    """
    All logging lines begin with a timestamp, parse it and return the datetime it represents.

    Example: 2016-04-14 14:50:33,325
    :param line: the log line containing time
    :return: native datetime
    """
    return datetime.strptime(line[:19], "%y-%m-%d %h:%M:%S")


def make_initial_state():
    """
    Create an initial state dictionary.
    """
    return {
        "geogrid": "waiting",
        "ingest": "waiting",
        "ungrib": "waiting",
        "metgrid": "waiting",
        "real": "waiting",
        "wrf": "waiting",
        "output": "waiting",
    }


def get_simulation_state(path):
    """
    Identify the state of the computation for each subcomponent
    from the output log. If the log does not exist, return default state.

    :param path: the path to the log file
    """
    state = make_initial_state()

    # for some reason the "with open(path) as f" started just quietly exiting
    # when the file does not exist...

    try:
        f = open(path)
        for line in f:
            if "Error" in line:
                parse_error(state, line)
            if "ERROR" in line:
                parse_error(state, line)
            if "subprocess.CalledProcessError" in line:
                parse_error(state, line)
            if "running GEOGRID" in line:
                state["geogrid"] = "running"
            elif "GEOGRID complete" in line:
                state["geogrid"] = "complete"
            elif "retrieving GRIB files" in line:
                state["ingest"] = "running"
            elif "running UNGRIB" in line:
                state["ingest"] = "complete"
                state["ungrib"] = "running"
            elif "UNGRIB complete" in line:
                state["ingest"] = "complete"
                state["ungrib"] = "complete"
            elif "running METGRID" in line:
                state["metgrid"] = "running"
            elif "METGRID complete" in line:
                state["metgrid"] = "complete"
            elif "running REAL" in line:
                state["metgrid"] = "complete"
                state["real"] = "running"
            elif "submitting WRF" in line:
                state["real"] = "complete"
                state["wrf"] = "submit"
            elif "Detected rsl.error.0000" in line:
                state["wrf"] = "running"
            elif "SHUTTLE operations completed" in line:
                state["output"] = "available"
            if "Cancelled" in line:
                state["wrf"] = "cancelled"
            if "WRF completion detected" in line:
                state["wrf"] = "complete"
            if "forecast.py done" in line:
                if state["wrf"] != "complete":
                    parse_error(state, line)
        f.close()
        if state["geogrid"] == "failed" or state["ungrib"] == "failed":
            state["metgrid"] = "failed"
            state["real"] = "failed"
            state["wrf"] = "failed"
            state["output"] = "failed"
        if state["metgrid"] == "failed":
            state["real"] = "failed"
            state["wrf"] = "failed"
            state["output"] = "failed"
        if state["real"] == "failed":
            state["wrf"] = "failed"
            state["output"] = "failed"
    except:
        print("Cannot open file %s" % path)
    return state
