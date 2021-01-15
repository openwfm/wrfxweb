"use strict";

var map = null;
var organization;
// list of layers which automatically become overlay rasters instead of regular rasters
var overlay_list = ['WINDVEC', 'WINDVEC1000FT', 'WINDVEC4000FT', 'WINDVEC6000FT', 'SMOKE1000FT', 'SMOKE4000FT', 'SMOKE6000FT', 'FIRE_AREA', 'SMOKE_INT', 'FGRNHFX', 'FLINEINT'];

function initialize_fdds() {
  //  initialize base layers & build map
  var baseLayerDict = {
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
  };


  // construct map with the base layers
  map = L.map('map-fd', {
    center: [37.34, -121.89],
    zoom: 7,
    layers: [baseLayerDict['OSM']],
    zoomControl: true,
    minZoom: 3
  });
  map.doubleClickZoom.disable();
  map.scrollWheelZoom.disable();
  
  const layerController = document.querySelector('layer-controller');
  layerController.buildMapBase(baseLayerDict);

  loadConfig();

  // add scale & zoom controls to the map
  L.control.scale({ position: 'bottomright' }).addTo(map);
}

/** Function that retrieves conf.json and sets the document title and flags if they exist. */
async function loadConfig() {
  const configData = await services.getConfigurations();
  if (configData.organization) {
    organization = configData.organization;
    if (!organization.includes("SJSU")) {
        map.panTo([39.7392, -104.9903]);
    }
    document.title = organization;
  }

  if (configData.flags) {
    let flags = configData.flags;
    const simulationFlags = document.querySelector("#simulation-flags");
    flags.map(flag => {
        var spanElement = document.createElement("span");
        spanElement.className = "displayTest";
        spanElement.innerText = flag;
        simulationFlags.appendChild(spanElement);
    });
  }
}
