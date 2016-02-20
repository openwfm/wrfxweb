"use strict";

/* load resources */
var fire_icon = L.icon({
  iconUrl: 'images/hot_fire.gif',
  iconSize: [15,15],
  iconAnchor: [7,7]
});


/*  initialize base layers & build map */
var osm_layer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});

var mpq_layer = L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
              attribution: 'Data and imagery by MapQuest',
              subdomains: ['otile1','otile2','otile3','otile4']
            });

var mpq_sat_layer = L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png', {
              attribution: 'Data and imagery by MapQuest',
              subdomains: ['otile1','otile2','otile3','otile4']
            });

var base_layer_dict = { 'MapQuest': mpq_layer,
												'MQ Satellite' : mpq_sat_layer,
												'OSM' : osm_layer };


/* construct map with the base layers */
var map = L.map('map-fd', {center: [39,-106],
            	            zoom: 7,
              	          layers: [mpq_layer],
												  zoomControl: false
                  	     });
zoomOut();


$.when(

  $.getJSON("simulations/catalog.json", function ( data ) {
    var list = $('<ul/>', { 'class' : 'catalog-list' }).appendTo('#catalog-content');
    $.each(data, function (cat_name) {
      var cat_entry = data[cat_name];
      var desc = cat_entry.description;
      var from = cat_entry.from_utc;
      var to = cat_entry.to_utc;
      var load_cmd = '"handle_select_click(\'simulations/' + cat_entry.manifest_path + '\');"';
      list.append('<li class="catalog-entry" onclick=' + load_cmd + '><b>' + desc + '</b><br/>' + 'from: ' + from + '<br/>to: ' + to + '</li>');
    });
  })).then(function() {

    $('ul.catalog-list > li.catalog-entry').mouseenter(function () {
        $(this).addClass('catalog-entry-sel').siblings().removeClass('catalog-entry-sel');
    });

    $('ul.catalog-list > li.catalog-entry').mouseleave(function () {
      $(this).removeClass('catalog-entry-sel');
    });

    /* auto-opens the dialog */
    $('#select-dialog').dialog();

	});


function zoomOut()
{
    map.fitBounds([[36.8,-109.2], [41.2, -101.8]]);
}

/* add scale & zoom controls to the map */
L.control.scale({ position: 'bottomright' }).addTo(map);

/* Map control declarations */
var layer_ctrl = null;

/* function that loads a simulation and sets up the UI to display it */
var rasters = null;
var sorted_timestamps = null;
var raster_base = null;
var raster_dict = {};
var current_display = null;
var current_timestamp = null;

map.on('overlayadd', function (e) {
  current_display = e.name;
  console.log('on add: ' + current_display);

  // remove all other rasters now
  if(e.name in raster_dict) {
    for(var n2 in raster_dict) {
      if(n2 != e.name) {
        map.removeLayer(raster_dict[n2]);
      }
      layer_ctrl._update();
    }
  }

  // extract current raster
  var rasters_now = rasters[current_timestamp];

  // get the colorbar url
  var cb_url = '';
  if('colorbar' in rasters_now[e.name]) {
      cb_url = raster_base + rasters_now[e.name].colorbar;
  }
  $('#raster-colorbar').attr('src', cb_url);
});

map.on('overlayremove', function (e) {
  current_display = null;
  $('#raster-colorbar').attr('src', '');
});

function setup_for_time(timestamp) {

    // set current time
    $('#time-valid').text(timestamp);

    // undisplay any existing raster
    var cd_memory = current_display;
    if(current_display != null) {
        map.removeLayer(raster_dict[cd_memory]);
    }

    raster_dict = {};
    $.each(rasters[timestamp], function (r) {
      var raster = rasters[timestamp][r];
      var cs = raster.coords;
      var bounds = [ [cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]]];
      raster_dict[r] = L.imageOverlay(raster_base + raster.raster,
                                      bounds,
                                      {attribution: 'UC Denver Wildfire Group',
                                       opacity: 0.5});
    });

    if(layer_ctrl != null) {
        layer_ctrl.removeFrom(map);
    }

    layer_ctrl = L.control.layers(base_layer_dict, raster_dict, {"collapsed" : false}).addTo(map);

    if (cd_memory != null) {
        map.addLayer(raster_dict[cd_memory]);
    }

    current_timestamp = timestamp;
}


function handle_select_click(path) {
  $('#select-dialog').dialog("close");
  $.getJSON(path, function (catalog) {
      rasters = catalog;
      var to = path.lastIndexOf('/');
      raster_base = path.substring(0, to+1);

      // retrieve all times
      sorted_timestamps = Object.keys(rasters).sort();

      // populate jquery slider
      $('#time-slider').slider({min: 0,
                                max: sorted_timestamps.length-1,
                                slide: function(event, ui) {
                                  setup_for_time(sorted_timestamps[ui.value]);
                                  current_frame = ui.value;
                                },
                                change: function(event, ui) {
                                  setup_for_time(sorted_timestamps[ui.value]);
                                  current_frame = ui.value;
                                }});

      // setup for time first frame
      setup_for_time(sorted_timestamps[0]);

  });
}

var playing = false;
var current_frame = 0;

function next_frame() {
  if(playing) {
    current_frame = (current_frame + 1) % sorted_timestamps.length;
    $('#time-slider').slider('value', current_frame);
    //setup_for_time(sorted_timestamps[current_frame]);
    window.setTimeout(next_frame, 500);
  }
}

function toggle_play() {
  if(!playing) {
    if(current_display != null) {
      $('#play-control-button > span').text('Pause');
      $('#play-control-button > i').attr('class', 'pause icon');

      playing = true;
      next_frame();
    }
  } else {
    $('#play-control-button > span').text('Play');
    $('#play-control-button > i').attr('class', 'play icon');

    playing = false;
  }
}

$('#time-slider').mousedown(function (e) {
    $('#time-slider').trigger('slidechange');
    e.stopPropagation();
});

function select_catalog() {
  /* auto-opens the dialog */
  $('#select-dialog').dialog("open");
}
