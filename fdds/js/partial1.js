"use strict";

// load resources
var fire_icon = L.icon({
  iconUrl: 'images/hot_fire.gif',
  iconSize: [15, 15],
  iconAnchor: [7, 7]
});


//  initialize base layers & build map
var base_layer_dict = {
  'MapQuest': L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                          attribution: 'Data and imagery by MapQuest',
                          subdomains: ['otile1', 'otile2', 'otile3', 'otile4']}),
  'MQ Satellite': L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png', {
                              attribution: 'Data and imagery by MapQuest',
                              subdomains: ['otile1', 'otile2', 'otile3', 'otile4']}),
  'OSM': L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                     attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'})
};


// construct map with the base layers
var map = L.map('map-fd', {
  center: [39, -106],
  zoom: 7,
  layers: [base_layer_dict['MapQuest']],
  zoomControl: false
});


$.when(

  $.getJSON("simulations/catalog.json", function(data) {
    var list = $('<ul/>', {
      'class': 'catalog-list'
    }).appendTo('#catalog-content');
    $.each(data, function(cat_name) {
      var cat_entry = data[cat_name];
      var desc = cat_entry.description;
      var from = cat_entry.from_utc;
      var to = cat_entry.to_utc;
      var load_cmd = '"handle_select_click(\'simulations/' + cat_entry.manifest_path + '\');"';
      list.append('<li class="catalog-entry" onclick=' + load_cmd + '><b>' + desc + '</b><br/>' + 'from: ' + from + '<br/>to: ' + to + '</li>');
    });
    
  })).then(function() {

    $('ul.catalog-list > li.catalog-entry').mouseenter(function() {
        $(this).addClass('catalog-entry-sel').siblings().removeClass('catalog-entry-sel');
    });

    /* auto-opens the dialog */
    $('#select-dialog').dialog();

});


// add scale & zoom controls to the map
L.control.scale({ position: 'bottomright' }).addTo(map);

// list of layers which automatically become overlay rasters instead of regular rasters
var overlay_list = ['WINDVEC', 'FIRE_AREA', 'SMOKE_INT', 'FGRNHFX', 'FLINEINT'];

// Variables containing input data
var rasters = null;
var sorted_timestamps = null;
var raster_base = null;
var raster_dict = {};  // rasters that can't be overlaid on other rasters
var overlay_dict = {}; // rasters that can be overlaid on top of each other and on top of raster_dict rasters

// Display context
var layer_ctrl = null;
var current_display = {}; // dictionary of layer name -> layer of currently displayed data
var current_timestamp = null; // currently displayed timestamp
var preloaded = {}; // dictionary containing information on what frames have been preloaded for which rasters/layers
var displayed_colorbar = null; // name of layer currently displaying its colorbar (maybe display multiple cbs?)

// Variables storing animation/playback context
var playing = false;
var current_frame = 0;

map.on('overlayadd', function(e) {
  // register in currently displayed layers and bring to front if it's an overlay
  current_display[e.name] = e.layer;
  if(overlay_list.indexOf(e.name) >= 0) {
    e.layer.bringToFront();
  } else {
    e.layer.bringToBack();
  }

  // if the overlay being added now has a colorbar and there is none displayed, show it
  if(displayed_colorbar == null) {
    var rasters_now = rasters[current_timestamp];
    if('colorbar' in rasters_now[e.name]) {
        var cb_url = raster_base + rasters_now[e.name].colorbar;
        $('#raster-colorbar').attr('src', cb_url);
        displayed_colorbar = e.name;
    }
  }

  // preload all displayed variables for eight frames
  preload_variables(8);
});


map.on('overlayremove', function(e) {
  delete current_display[e.name];

  if(displayed_colorbar == e.name) {
    $('#raster-colorbar').attr('src', '');
    displayed_colorbar = null;
  }
});

// this function should assume that the correct layers are already displayed
function setup_for_time(frame_ndx) {

  var timestamp = sorted_timestamps[frame_ndx];
  var rasters_now = rasters[timestamp];
  current_frame = frame_ndx;

  // set current time
  $('#time-valid').text(timestamp);

  // modify the URL each displayed cluster is pointing to
  // so that the current timestamp is reflected
  for (var layer_name in current_display) {
    var layer = current_display[layer_name];
    if(layer != null) {
      var raster_info = rasters_now[layer_name];
      var cs = raster_info.coords;
      layer.setUrl(raster_base + raster_info.raster,
                  [ [cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]] ],
                  { attribution: 'UC Denver Wildfire Group', opacity: 0.5 });
    }
  }

  current_timestamp = timestamp;
  preload_variables(8);
}


function handle_select_click(path) {
  // close selection dialog
  $('#select-dialog').dialog("close");

  // remove any existing layers from map
  for(var layer_name in current_display) {
    map.removeLayer(current_display[layer_name]);
  }
  preloaded = {};
  current_display = {};

  $.getJSON(path, function(selected_simulation) {
    // store in global state
    rasters = selected_simulation;
    raster_base = path.substring(0, path.lastIndexOf('/') + 1);

    // retrieve all times
    sorted_timestamps = Object.keys(rasters).sort();

    // populate jquery time slider
    $('#time-slider').slider({
      min: 0,
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

    // zoom in to the raster region, FIXME: can't rely on T2 being there all the time
    var cs = rasters[sorted_timestamps[0]]['T2'].coords;
    map.fitBounds([ [cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]] ]);
    
    // build the layer groups
    raster_dict = {};
    overlay_dict = {};    
    $.each(rasters[sorted_timestamps[0]], function(r) {
      var raster_info = rasters[sorted_timestamps[0]][r];
      var cs = raster_info.coords;
      var layer = L.imageOverlay(raster_base + raster_info.raster,
                                 [[cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]]],
                                 {
                                    attribution: 'UC Denver Wildfire Group',
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

  // setup for time first frame
  current_frame = 0;
  playing = false;
  setup_for_time(0);
});

}

function open_catalog() {
  $('#select-dialog').dialog("open");
}

// Section containing animation/playback code

function frame_ready(frame_ndx) {
  // for all layers currently displayed
  for(var key in current_display) {
    // if the current frame is not preloaded yet
    if(!(frame_ndx in preloaded[key])) {
      console.log('Frame ' + frame_ndx + ' not ready for var ' + key);
      return false;
    }
    // check if the raster has a colorbar
    var cb_key = key + '_cb';
    if(cb_key in preloaded) {
      // it does, is it preloaded?
      if (!(frame_ndx in preloaded[cb_key])) {
        console.log('Frame ' + frame_ndx + ' (colorbar) not ready for var ' + key);
        return false;
      }
    }
  }
  console.log('Frame ' + frame_ndx + ' is ready for display.');
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
  var n_rasters = Object.keys(rasters).length;
  for(var counter=0; counter < preload_count; counter++) {
    var i = (current_frame + counter) % n_rasters;
    var timestamp = sorted_timestamps[i];
    for(var var_name in current_display) {
      // it could happen that a timestamp is missing the variable
      if(var_name in rasters[timestamp]) {
        // have we already preloaded this variable? If not indicate nothing is preloaded.
        if(!(var_name in preloaded)) {
          preloaded[var_name] = {};
        }

        if(!(i in preloaded[var_name])) {
          //console.log('Frame ' + i + ' not preloaded for ' + var_name + ' (current_frame = ' + current_frame + ')');
          var var_info = rasters[timestamp][var_name];
          $.get(raster_base + var_info.raster, function(ndx, var_name) { return function(img) { preloaded[var_name][ndx] = img; } } (i, var_name));
          if ('colorbar' in var_info) {
            var cb_key = var_name + '_cb';
            if(!(cb_key in preloaded)) {
              preloaded[cb_key] = {};
            }
            $.get(raster_base + var_info.colorbar, function(ndx, cb_key) { return function(img) { preloaded[cb_key][ndx] = img; } } (i, cb_key));
          }
        }
      }
    }
  }
}
