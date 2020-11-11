"use strict";

// global vars
var base_layer_dict = null;
var map = null;

// the entire catalog
var catalog = null;

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

// Variables storing animation/playback context
var playing = false;
var current_frame = 0;

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


  // add scale & zoom controls to the map
  L.control.scale({ position: 'bottomright' }).addTo(map);

  map.on('overlayadd', function (e) { handle_overlayadd(e.name, e.layer) });

  map.on('overlayremove', function(e) {
    delete current_display[e.name];

    if(displayed_colorbar == e.name) {
      $('#raster-colorbar').attr('src', '');
      $('#raster-colorbar').hide();
      displayed_colorbar = null;
    }
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
  // if(displayed_colorbar == null) {
    var rasters_now = rasters[current_domain][current_timestamp];
    if('colorbar' in rasters_now[name]) {
        var cb_url = raster_base + rasters_now[name].colorbar;
        $('#raster-colorbar').attr('src', cb_url).show();
        displayed_colorbar = name;
    }
  // }

  // preload all displayed variables for eight frames
  preload_variables(8);
}

function setup_for_domain(dom_id) {
  // set the current domain
  current_domain = dom_id;

  // remove any existing layers from map
  var displayed_layers = Object.keys(current_display);
  for(var layer_name in current_display) {
    map.removeLayer(current_display[layer_name]);
  }
  preloaded = {};
  current_display = {};

	// retrieve all times (we assume the first domain is selected)
	sorted_timestamps = Object.keys(rasters[current_domain]).sort();

	// setup for time first frame
	current_frame = 0;
	current_timestamp = sorted_timestamps[0];
	if(playing) toggle_play();

	// populate jquery time slider
	$('#time-slider').slider({
		min: 0,
		value: 0,
		max: sorted_timestamps.length - 1,
		change: function(event, ui) {
			setup_for_time(ui.value);
		},
		slide: function(event, ui) {}
	});

	$('#time-slider').mousedown(function(e) {
		if(playing) toggle_play();
		e.stopPropagation();
	});

	if(sorted_timestamps.length < 2) {
		$('#time-slider').hide();
		$('#play-control-button').hide();
	} else {
		$('#time-slider').show();
		$('#play-control-button').show();
	}

  // zoom into raster region
  var first_rasters = rasters[dom_id][sorted_timestamps[0]];
  var vars = Object.keys(first_rasters);
  var cs = first_rasters[vars[0]].coords;
  map.fitBounds([ [cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]] ]);
  
  // build the layer groups
  raster_dict = {};
  overlay_dict = {};    
  $.each(first_rasters, function(r) {
    var raster_info = first_rasters[r];
    var cs = raster_info.coords;
    var layer = L.imageOverlay(raster_base + raster_info.raster,
                                [[cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]]],
                                {
                                  attribution: 'SJSU WIRC',
                                  opacity: 0.5
                                });
    if(overlay_list.indexOf(r) >= 0) {
        overlay_dict[r] = layer;
    } else {
        raster_dict[r] = layer;
    }
  });
  
  // remove any existing layer control
  if (layer_ctrl != null) {
    layer_ctrl.removeFrom(map);
  }

  // add a new layer control to the map
  layer_ctrl = L.control.groupedLayers(base_layer_dict, {
    'Rasters': raster_dict,
    'Overlays': overlay_dict
  }, {
    collapsed: false
  }).addTo(map);

  $.each(first_rasters, function(r) {
  	if(displayed_layers.indexOf(r) >= 0) {
      var layer = null;
      if(r in raster_dict) {
        layer = raster_dict[r];
      } else {
        layer = overlay_dict[r];
      }
			map.addLayer(layer);
      handle_overlayadd(r, layer);
		}
  });
  layer_ctrl._update();

  setup_for_time(0);
}

// this function should assume that the correct layers are already displayed
function setup_for_time(frame_ndx) {
  current_frame = frame_ndx;
  var timestamp = sorted_timestamps[frame_ndx];
  current_timestamp = timestamp;
  var rasters_now = rasters[current_domain][timestamp];

  // set current time
  $('#time-valid').text(timestamp).show();

  preload_variables(8);

  // modify the URL each displayed cluster is pointing to
  // so that the current timestamp is reflected
  for (var layer_name in current_display) {
    var layer = current_display[layer_name];
    if(layer != null) {
      var raster_info = rasters_now[layer_name];
      var cs = raster_info.coords;
      layer.setUrl(raster_base + raster_info.raster,
                  [ [cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]] ],
                  { attribution: 'SJSU WIRC', opacity: 0.5 });
    }
  }
}
 
// Section containing animation/playback code
function frame_ready(frame_ndx) {
  // for all layers currently displayed
  for(var key in current_display) {
    // if the current frame is not preloaded yet
    if(!(frame_ndx in preloaded[key])) {
      //console.log('Frame ' + frame_ndx + ' not ready for var ' + key);
      return false;
    }
    // check if the raster has a colorbar
    var cb_key = key + '_cb';
    if(cb_key in preloaded) {
      // it does, is it preloaded?
      if (!(frame_ndx in preloaded[cb_key])) {
        //console.log('Frame ' + frame_ndx + ' (colorbar) not ready for var ' + key);
        return false;
      }
    }
  }
  //console.log('Frame ' + frame_ndx + ' is ready for display.');
  return true;
}

function schedule_next_frame() {
  if(current_frame == sorted_timestamps.length-1){
    window.setTimeout(next_frame, 1000);
  } else {
    window.setTimeout(next_frame, 330);
  }
}

function next_frame() {
  if (playing) {
    current_frame = (current_frame + 1) % sorted_timestamps.length;
    if(frame_ready(current_frame)) {
      $('#time-slider').slider('value', current_frame);
      schedule_next_frame();
    } else {
      // if the next frame is not ready, preload further and wait longer
      window.setTimeout(wait_for_frame, 500);
      preload_variables(8);
    }
  }
}

function wait_for_frame() {
  // don't do anything if playing has been cancelled
  if(!playing) {
    return
  }
  // wait until current frame is loaded
  if(frame_ready(current_frame)) {
    $('#time-slider').slider('value', current_frame);
    schedule_next_frame();
  } else {
    // keep waiting until all parts of frame are loaded
    window.setTimeout(wait_for_frame, 250);
  }
}

function toggle_play() {
  if (!playing) {
    $('#play-control-button > span').text('Pause');
    $('#play-control-button > i').attr('class', 'pause icon');
    playing = true;
    next_frame();
  } else {
    $('#play-control-button > span').text('Play');
    $('#play-control-button > i').attr('class', 'play icon');
    playing = false;
  }
}

/* Code handling auxiliary tasks */
function preload_variables(preload_count) {
  var rasters_dom = rasters[current_domain];
  var n_rasters = Object.keys(rasters_dom).length;
  for(var counter=0; counter < preload_count; counter++) {
    var i = (current_frame + counter) % n_rasters;
    var timestamp = sorted_timestamps[i];
    for(var var_name in current_display) {
      // it could happen that a timestamp is missing the variable
      if(var_name in rasters_dom[timestamp]) {
        // have we already preloaded this variable? If not indicate nothing is preloaded.
        if(!(var_name in preloaded)) {
          preloaded[var_name] = {};
        }

        if(!(i in preloaded[var_name])) {
          //console.log('Frame ' + i + ' not preloaded for ' + var_name + ' (current_frame = ' + current_frame + ')');
          var var_info = rasters_dom[timestamp][var_name];
					var img = new Image();
					img.onload = function (ndx, var_name, img, preloaded) { return function() { preloaded[var_name][ndx] = img; } } (i, var_name, img, preloaded);
					img.src = raster_base + var_info.raster;
        }
      }
    }
  }
}
