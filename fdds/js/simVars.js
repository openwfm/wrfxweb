export const simVars = (function createSimVars() {
  const urlParams = new URLSearchParams(window.location.search);

  let presetVars = ({
    zoom: urlParams.get('zoom'),
    pan: urlParams.get('pan'),
    jobId: urlParams.get('job_id'),
    domain: urlParams.get('domain'),
    timestamp: urlParams.get('timestamp'),
    rasters: null,
    startDate: urlParams.get('startDate'),
    endDate: urlParams.get('endDate'),
    opacity: urlParams.get('opacity'),
  });

  let pan = urlParams.get('pan');
  if (pan) {
    pan = pan.split(',').map(coord => Number(coord));
    presetVars.pan = pan;
  }

  let rasters = urlParams.get('rasters');
  if (rasters) {
    rasters = rasters.split(',');
    presetVars.rasters = rasters;
  }

  let simVars = ({
    currentSimulation: '',
    currentDescription: '',
    rasters: [],
    rasterBase: '',
    sortedTimestamps: [],
    showColorbar: () => {
      const rasterColorbarContainer = document.querySelector('#raster-colorbar-bg');
      rasterColorbarContainer.classList.remove('hidden');
    },
    hideColorbar: () => {
      const rasterColorbarContainer = document.querySelector('#raster-colorbar-bg');
      rasterColorbarContainer.classList.add('hidden');
    },
    setColorbarURL: (url) => {
      const rasterColorbar = document.querySelector('#raster-colorbar');
      rasterColorbar.src = url;
    },
    noLevels: (function makeNoLevels() {
      const noLevels = new Set();
      const makeKey = (layerName, domain, timestamp) => {
        return layerName + ',' + domain + ',' + timestamp;
      }
      const addNoLevels = (layerName, domain, timestamp) => {
        let key = makeKey(layerName, domain, timestamp);
        noLevels.add(key);
      }
      const hasNoLevels = (layerName, domain, timestamp) => {
        let key = makeKey(layerName, domain, timestamp);
        return noLevels.has(key);
      }

      return ({
        add: addNoLevels,
        has: hasNoLevels,
        clear: () => noLevels.clear()
      });
    })(),
    overlayOrder: [],
    startTime: null,
    endTime: null,
    displayedColorbar: null,
    organization: 'WIRC',
    overlayList: ['WINDVEC', 'WINDVEC1000FT', 'WINDVEC4000FT', 'WINDVEC6000FT', 'SMOKE1000FT', 'SMOKE4000FT', 'SMOKE6000FT', 'FIRE_AREA', 'SMOKE_INT', 'FGRNHFX', 'FLINEINT'],
    baseLayerDict: {
    /*
      'MapQuest': L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                              attribution: 'Data and imagery by MapQuest',
                              subdomains: ['otile1', 'otile2', 'otile3', 'otile4']}),
    */
      'MapQuest' : MQ.mapLayer(),
    /*	'MQ Satellite': L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png', {
                                  attribution: 'Data and imagery by MapQuest',
                                  subdomains: ['otile1', 'otile2', 'otile3', 'otile4']}),*/
      'OSM': L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'})
    },
    presets: presetVars
  });

  return simVars;
})();