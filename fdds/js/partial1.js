"use strict";

// Many of these are only referenced now inside a singe component, find out which ones, and remove them from here
// global vars
var base_layer_dict = null;
var raster_dict = {};
var overlay_dict = {};
var map = null;
var organization;

// list of layers which automatically become overlay rasters instead of regular rasters
var overlay_list = ['WINDVEC', 'WINDVEC1000FT', 'WINDVEC4000FT', 'WINDVEC6000FT', 'SMOKE1000FT', 'SMOKE4000FT', 'SMOKE6000FT', 'FIRE_AREA', 'SMOKE_INT', 'FGRNHFX', 'FLINEINT'];

// Variables containing input data
var rasters = null;
var sorted_timestamps = null;
var raster_base = null;

// Display context
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
  
  const layerController = document.querySelector('layer-controller');
  layerController.buildMapBase();

  loadConfig();

  // add scale & zoom controls to the map
  L.control.scale({ position: 'bottomright' }).addTo(map);
}

function loadConfig() {
  fetch('conf.json').then(response => response.json()).then(function(configData) { 
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
  }).catch(error => {
    console.error(error);
  });
}

/** Makes given element draggable from sub element with id "subID" */
function dragElement(elmnt, subID) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  var elmntLeft = 0, elmntTop = 0;
  var clientWidth = document.body.clientWidth, clientHeight = document.body.clientHeight;
  if (clientWidth < 769) return;
  document.getElementById(elmnt.id + subID).onpointerdown = dragMouseDown;
  window.addEventListener("resize", () => {
    if (elmntLeft != 0 && elmnt.offsetLeft + (elmnt.clientWidth / 2) > (document.body.clientWidth / 2)) {
      elmntLeft = elmntLeft - (clientWidth - document.body.clientWidth); 
      elmnt.style.left = elmntLeft + "px";
    }
    if (elmntTop != 0 && elmnt.offsetTop + (elmnt.clientHeight / 2) > (document.body.clientHeight / 2)) {
      elmntTop = elmntTop - (clientHeight - document.body.clientHeight);
      elmnt.style.top = elmntTop + "px";
    }
    clientWidth = document.body.clientWidth;
    clientHeight = document.body.clientHeight;
  })

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    e.stopPropagation();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onpointerup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onpointermove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    e.stopPropagation();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    if (elmntLeft == 0) {
      elmntLeft = elmnt.offsetLeft;
      elmntTop = elmnt.offsetTop;
    }
    // set the element's new position:
    if (Math.abs(pos1) >= 1 && elmntLeft - pos1 > 0 && elmntLeft + elmnt.clientWidth - pos1 < clientWidth) {
      elmntLeft = elmntLeft - pos1;
      elmnt.style.left = elmntLeft + "px";
    }
    if (Math.abs(pos2) >= 1 && elmntTop - pos2 > 0 && elmntTop + elmnt.clientHeight - pos2  < clientHeight) {
      elmntTop = elmntTop - pos2;
      elmnt.style.top = elmntTop + "px";
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onpointerup = null;
    document.onpointermove = null;
  }
}

/** Calculates the left offset of given element by going up the elements parents and summing offsets. */
function getOffsetLeft(element) {
  let offsetLeft = 0;
  while (element) {
    offsetLeft += element.offsetLeft;
    element = element.offsetParent;
  }
  return offsetLeft;
}

