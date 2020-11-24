"use strict";

// global vars
var base_layer_dict = null;
var map = null;
var organization;

// list of layers which automatically become overlay rasters instead of regular rasters
var overlay_list = ['WINDVEC', 'WINDVEC1000FT', 'WINDVEC4000FT', 'WINDVEC6000FT', 'SMOKE1000FT', 'SMOKE4000FT', 'SMOKE6000FT', 'FIRE_AREA', 'SMOKE_INT', 'FGRNHFX', 'FLINEINT'];

// Variables containing input data
var rasters = null;
var domains = null;
var sorted_timestamps = null;
var raster_base = null;
var raster_dict = {};  // rasters that can't be overlaid on other rasters
var overlay_dict = {}; // rasters that can be overlaid on top of each other and on top of raster_dict rasters

// Display context
var current_domain = null;
var layer_ctrl = null;
var current_display = {}; // dictionary of layer name -> layer of currently displayed data
var current_timestamp = null; // currently displayed timestamp
var preloaded = {}; // dictionary containing information on what frames have been preloaded for which rasters/layers
var displayed_colorbar = null; // name of layer currently displaying its colorbar (maybe display multiple cbs?)
var displayed_colorbars = [];

function initialize_fdds() {

  //  initialize base layers & build map
  base_layer_dict = {
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
    layers: [base_layer_dict['OSM']],
    zoomControl: false,
    minZoom: 3
  });

  loadConfig();

  // add scale & zoom controls to the map
  L.control.scale({ position: 'bottomright' }).addTo(map);

  map.on('overlayadd', function (e) { handle_overlayadd(e.name, e.layer) });

  map.on('overlayremove', function(e) {
    delete current_display[e.name];

    displayed_colorbars = displayed_colorbars.filter(colorbars => colorbars.name != e.name);
    const rasterColorbar = document.querySelector('#raster-colorbar');
    if (displayed_colorbars.length == 0) {
      rasterColorbar.src = '';
      rasterColorbar.style.display = 'none';
      displayed_colorbar = null;
    } else {
      let mostRecentColorBar = displayed_colorbars[displayed_colorbars.length - 1];
      rasterColorbar.src = mostRecentColorBar.url;
      displayed_colorbar = mostRecentColorBar.name;
    }
  });
}

function loadConfig() {
  fetch("/etc/conf.json").then(response => response.json()).then(function(data) { 
    organization = data.organization;

    if (!organization.includes("SJSU")) {
      map.panTo([39.7392, -104.9903]);
    }
    let flags = data.flags;
    document.title = organization;
    const simulationFlags = document.querySelector("#simulation-flags");
    flags.map(flag => {
      var spanElement = document.createElement("span");
      spanElement.className = "displayTest";
      spanElement.innerText = flag;
      simulationFlags.appendChild(spanElement);
    });
  }).catch(error => {
    console.log("Error getting conf.json " + error);
  });
}

function handle_overlayadd(name, layer) {
  // register in currently displayed layers and bring to front if it's an overlay
  console.log('name ' + name + ' layer ' + layer);
  current_display[name] = layer;
  if(overlay_list.indexOf(name) >= 0) {
    layer.bringToFront();
  } else {
    layer.bringToBack();
  }

  // if the overlay being added now has a colorbar and there is none displayed, show it
  var rasters_now = rasters[current_domain][current_timestamp];
  if('colorbar' in rasters_now[name]) {
      var cb_url = raster_base + rasters_now[name].colorbar;
      const rasterColorbar = document.querySelector('#raster-colorbar');
      rasterColorbar.src = cb_url;
      rasterColorbar.style.display = 'block';
      displayed_colorbar = name;
      displayed_colorbars.push({name: name, url: cb_url});
  }
  const simulationController = document.querySelector('simulation-controller');
  simulationController.updateSlider();
}
