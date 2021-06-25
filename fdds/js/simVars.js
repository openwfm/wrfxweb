export const simVars = (function createSimVars() {
  const urlParams = new URLSearchParams(window.location.search);

  var presetVars = ({
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

  var pan = urlParams.get('pan');
  if (pan) {
    pan = pan.split(',').map(coord => Number(coord));
    presetVars.pan = pan;
  }

  var rasters = urlParams.get('rasters');
  if (rasters) {
    rasters = rasters.split('-');
    presetVars.rasters = rasters;
  }

  var simVars = ({
    currentSimulation: '',
    rasters: [],
    rasterBase: '',
    sortedTimestamps: [],
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

/** Service request for fetching the conf.json file. */
async function getConfigurations() {
    await fetch('conf.json').then(response => response.json()).then(function(configData) {
        if (configData.organization) {
            simVars.organization = configData.organization;
        }
        document.title = simVars.organization;
    
        if (configData.flags) {
            const simulationFlags = document.querySelector('#simulation-flags');
            var flags = configData.flags;
            flags.map(flag => {
                var spanElement = document.createElement('span');
                spanElement.className = 'displayTest';
                spanElement.innerText = flag;
                simulationFlags.appendChild(spanElement);
            });
        }
    }).catch(error => {
        console.error('Error fetching conf.json : ' + error);
    });
}