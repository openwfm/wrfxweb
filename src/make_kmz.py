import simplekml as kml
import os.path as osp
import json
import sys
import logging
from utils import update_nested_dict, load_sys_cfg
from urlparse import urljoin
import posixpath as pxp
import requests

sys_cfg = load_sys_cfg()
sys_cfg.sims_path = 'fdds/simulations'
sys_cfg.sims_url_path = 'simulations'

def make_kmz(job_id, mode, only_vars):

    logging.info('make_kmz: job_id=%s' % job_id)
    job_path = osp.join(osp.abspath(sys_cfg.sims_path),job_id)
    url_prefix = pxp.join(sys_cfg.url_root,sys_cfg.sims_url_path,job_id)
    logging.info('make_kmz: job_path %s' % job_path)
    logging.info('make_kmz: url_prefix %s' % url_prefix)
  
    if mode == '' or mode == "inc":
        kmz_filename = job_id + '_inc.kmz'
        href_prefix = osp.abspath(job_path)
        href_join = osp.join
        logging.info('make_kmz: kmz file will include images from %s' % href_prefix)
    elif mode == "ref":
        kmz_filename = job_id + '_ref.kmz'    
        href_prefix = url_prefix
        href_join = pxp.join
        logging.info('make_kmz: kmz file will link images from %s' % href_prefix)
    else:
        logging.error('make_kmz: arg 2 must be "inc" or "ref" or omitted')
        exit(1)
   
    # read the catalog and the manifest
    cat = json.load(open(osp.join(job_path,'catalog.json')))
    if job_id not in cat:
         logging.error('job id %s not in the catalog' % job_id)
         sys.exit(1)
    cat = cat[job_id]
    mf = json.load(open(osp.join(sys_cfg.sims_path,cat['manifest_path'])))

    description = cat['description']
    logging.info('make_kmz: job description: %s' % description)
    
    # transpose var and time in manifest, output to frame
    frame={}
    for domain in mf:
        for ts_esmf in mf[domain]:
            for var in mf[domain][ts_esmf]:
                if only_vars is None or var in only_vars:
                    update_nested_dict(frame,{domain:{var:{ts_esmf:mf[domain][ts_esmf][var]}}})
                     
    doc = kml.Kml(name=description)
    
    for domain in frame:
        domain_folder = doc.newfolder(name = domain)
        for var in frame[domain]:
            var_folder = domain_folder.newfolder(name = var)
            ts_esmf = sorted(frame[domain][var].keys())
            ts_esmf1 = ts_esmf[1:]
            ts_esmf1.append(None)
            for ts_esmf,ts_esmf1 in zip(ts_esmf,ts_esmf1):
                ts_folder = var_folder.newfolder(name = ts_esmf)
                ts_folder.timespan.begin = ts_esmf.replace('_','T')+'Z'
                if ts_esmf1 is not None:
                     ts_folder.timespan.end = ts_esmf1.replace('_','T')+'Z'
                frame_data = frame[domain][var][ts_esmf]
                raster_path = frame_data['raster']
                coords = frame_data['coords']
                if 'colorbar' in frame_data:
                    # add colorbar to KMZ
                    cb_path = frame_data['colorbar']
                    cbo = ts_folder.newscreenoverlay(name='colorbar')
                    cbo.overlayxy = kml.OverlayXY(x=0,y=1,xunits=kml.Units.fraction,yunits=kml.Units.fraction)
                    cbo.screenxy = kml.ScreenXY(x=0.02,y=0.95,xunits=kml.Units.fraction,yunits=kml.Units.fraction)
                    cbo.size = kml.Size(x=150,y=300,xunits=kml.Units.pixel,yunits=kml.Units.pixel)
                    cbo.color = kml.Color.rgb(255,255,255,a=150)
                    cbo.visibility = 0
                    cbo.icon.href = href_join(href_prefix,cb_path)

                # add ground overlay
                ground = ts_folder.newgroundoverlay(name=var,color='80ffffff')
                ground.gxlatlonquad.coords = coords
                ground.visibility = 0
                ground.icon.href = href_join(href_prefix,raster_path)
    
    # build output file
    kmz_path = osp.join(job_path,kmz_filename)
    logging.info('make_kmz: creating file %s' % kmz_path) 
    doc.savekmz(kmz_path)
    url = pxp.join(url_prefix,kmz_filename)
    logging.info('make_kmz: file created at %s' % url) 
    try:
        r = requests.get(url, stream=True)
        content_size = int(r.headers['Content-Length'])
        logging.info('make_kmz: file size is %s' % content_size) 
    except:
        logging.warning('make_kmz: accessing the file over the web failed') 
       

 

                 
                 
if __name__ == '__main__':

    sys.argv

    if len(sys.argv) < 2:
        print('usage: make_kmz.sh job_id href_prefix variable1 variable2 ...')
        print('job_id: the name of job directory in ' + sims_path)
        print('url_prefix (optional): http URL of the job directory for link to images') 
        print('    if url_prefix is absent or empty, images will be included in the kmz file')
        print('variable (optional): variables to include; if absent all will be included')
        sys.exit(1)

    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    job_id = sys.argv[1]

    if len(sys.argv) >= 3 and sys.argv[2] != '':
        url_prefix = sys.argv[2]
    else:
        url_prefix=''

    if len(sys.argv) >= 4:
        only_vars = sys.argv[4:]
    else:
        only_vars = None

    make_kmz(job_id, url_prefix, only_vars)

