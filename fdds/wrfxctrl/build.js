"use strict";
/** ===== Contents ===== 
  1. Initialization block
  2. IgnitionMarkers block 
  3. DrawingDataOnMap block
  4. SatelliteData block
  5. FormSubmission block 
  */

/** ===== Initialization block ===== */
const MULTIPLE_IGNITION_TIMES = "multiple";
const IGNITION_TYPE_AREA = "ignition-area";
const IGNITION_TYPE_LINE = "ignition-line";
const IGNITION_TYPE_MULTIPLE = "multiple-ignitions";
const SATELLITE_DATA_BATCH_SIZE = 50;
const TIMEOUT_MS = 80;

var map = null;
var base_layer_dict = null;
var ignitionMarkers = [];
var perimeterMarkers = [];
var activeMarkerId = 0;
var activePerimeterId = 0;
var ignitionTimes = [];
var ignitionArea = null;
var ignitionLine = null;
var satelliteJSON = {};
var satelliteMarkers = [];
var addingSatData = false;
// var bufferId = 0;
// var bufferFields = {0: []};
// var bufferGroup = 0;

// map initialization code
// function initialize_map() {

//     base_layer_dict = {
//       'MapQuest': MQ.mapLayer(),
//       'MQ Satellite': L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png', {
//                                   attribution: 'Data and imagery by MapQuest',
//                                   subdomains: ['otile1', 'otile2', 'otile3', 'otile4']}),
//       'OSM': L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
//                          attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'})
//     };

//     // initialize map
//     map = L.map('map', {
//       center: [39, -106],
//       zoom: 7,
//       layers: [base_layer_dict['OSM']],
//       zoomControl: true,
//       minZoom: 3
//     });

//     L.DomUtil.addClass(map._container,'pointer-cursor-enabled');
//     map.doubleClickZoom.disable();
//     map.scrollWheelZoom.disable();

//     // add lon/lat display to bottom left corner of map
//     L.control.mousePosition().addTo(map);
// }

function set_profile_text(txt) {
  $("#profile-info-text").text(txt);
}

// initialize Semantic elements
$("#profile-dropdown").dropdown({ on: "hover" });
// $('#ign-time-0-').datepicker({ value: moment().utc(), formatTime: 'h:mm a', formatDate: 'm.d.Y', step:15 });
// $('#additional-marker').click(createIgnitionMarker);
// $('#remove-marker').click(() => removeIgnitionMarker());
// $('#ignition-type').change(updateUIToIgnitionType)
// $('#ignition-times-count').change(updateTimesOfIgnition);
$("#show-sat-data").prop("checked", false);
// $('#add-buffer-line').prop('checked', false);
$("#show-sat-data").click(showSatData);
// $('#ignition-type').dropdown();
// $('#ignition-times-count').dropdown();
$("#buffer-type").dropdown();
// $(`#ign-time-perimeter`).datetimepicker({ value: moment().utc(), formatTime: 'h:mm a', formatDate: 'm.d.Y', step:15 });
// createIgnitionMarker();
// createPerimeterMarker();
// updateUIToIgnitionType();
$(".ui.menu").on("click", ".item", function() {
  $(this).addClass("active").siblings(".item").removeClass("active");
});
// Fill in a 'unique description'
$("#experiment-description").text(
  "Web initiated forecast at " + moment().format(),
);

// function ignitionType() {
//   return $('#ignition-type').val();
// }

// function isMarkerTypePerimeter() {
//   return ignitionType() == "ignition-area";
// }
/** ===== IgnitionMarkers block ===== */

// function createIgnitionMarker() {
//   let newFieldId = ignitionMarkers.length;
//   const newMarkerField = new IgnitionMarker(newFieldId);
//   $('#markers').append(newMarkerField);
//   ignitionMarkers.push(newMarkerField);
//   setActiveIgnitionMarker(newFieldId);
//   if (($('#ignition-type').val() != IGNITION_TYPE_AREA && $('#ignition-times-count').val() == MULTIPLE_IGNITION_TIMES)
//    || ignitionTimes.length == 0) createTimeOfIgnition();
// }

// function createPerimeterMarker() {
//   let newFieldId = perimeterMarkers.length;
//   const newMarkerField = new IgnitionMarker(newFieldId);
//   $('#perimeter-markers').append(newMarkerField);
//   perimeterMarkers.push(newMarkerField);
//   setActivePerimeterMarker(newFieldId);
//   if ((ignitionType() != IGNITION_TYPE_AREA && $('#ignition-times-count').val() == MULTIPLE_IGNITION_TIMES)
//    || ignitionTimes.length == 0) createTimeOfIgnition();
// }

// function createTimeOfIgnition() {
//   let newFieldId = ignitionTimes.length;
//   const ignitionField = new IgnitionTime(newFieldId);
//   $('#ignition-times').append(ignitionField);
//   ignitionTimes.push(ignitionField);
// }

// function createBufferMarker() {
//   const newBufferId = bufferFields[bufferGroup].length;
//   const newBufferField = new IgnitionMarker(newBufferId);
//   $('#buffer-markers').append(newBufferField);
//   bufferFields[bufferGroup].push(newBufferField);
//   bufferId = newBufferId;
// }

// function setActiveIgnitionMarker(nextActiveMarkerId) {
//   ignitionMarkers[activeMarkerId].setInactive();
//   ignitionMarkers[nextActiveMarkerId].setActive();
//   activeMarkerId = nextActiveMarkerId;
// }

// function setActivePerimeterMarker(nextActiveMarkerId) {
//   perimeterMarkers[activePerimeterId].setInactive();
//   perimeterMarkers[nextActiveMarkerId].setActive();
//   activePerimeterId = nextActiveMarkerId;
// }

// function removeIgnitionMarker(id = ignitionMarkers.length - 1) {
//   if (ignitionMarkers.length < 2) {
//     return;
//   }
//   if (activeMarkerId == ignitionMarkers.length - 1 ){
//     activeMarkerId = activeMarkerId - 1;
//   }
//   const lastMarker = ignitionMarkers[id];
//   for (let i = id + 1; i < ignitionMarkers.length; i++ ) {
//     ignitionMarkers[i].updateIndex(i - 1);
//   }
//   ignitionMarkers.splice(id, 1);
//   if (lastMarker.mapMarker) {
//     map.removeLayer(lastMarker.mapMarker);
//   }
//   lastMarker.remove();
//   setActiveIgnitionMarker(activeMarkerId)
//   let ignitionType = $('#ignition-type').val();
//   if (ignitionType == IGNITION_TYPE_MULTIPLE || ignitionType == IGNITION_TYPE_LINE) {
//     removeTimeOfIgnition(id);
//   }
//   updateIgnitionDataOnMap();
// }

// function removeTimeOfIgnition(id = ignitionTimes.length - 1) {
//   if (ignitionTimes.length == 1) {
//     return;
//   }
//   for (let i = id + 1; i < ignitionTimes.length; i++) {
//     ignitionTimes[i].updateIndex(i);
//   }
//   const lastIgnitionTime = ignitionTimes.splice(id, 1)[0];
//   lastIgnitionTime.remove();
// }

// function calculateCentroid(latLon) {

// }

/** ===== DrawingDataOnMap block ===== */

// function updateIgnitionDataOnMap() {
//   let ignitionType = $('#ignition-type').val();
//   removeDrawnFeatures();
//   if (ignitionType == IGNITION_TYPE_LINE) {
//     updateIgnitionLine();
//   } else if (ignitionType == IGNITION_TYPE_AREA) {
//     // updateIgnitionArea();
//   }
// }

// function updateIgnitionLine() {
//   if ($('#ignition-type').val() != IGNITION_TYPE_LINE) {
//     return;
//   }
//   let latLons = ignitionMarkers.map(marker =>
//     marker.getLatLon()).filter(l => l.length > 0);
//   if (latLons.length > 1) {
//     ignitionLine = L.polyline(latLons, {color: 'orange'}).addTo(map);
//   }
// }

// function updateIgnitionArea() {
//   if ($('#ignition-type').val() != IGNITION_TYPE_AREA) {
//     return;
//   }
//   let latLons = [];
//   for (let i = 0; i < ignitionMarkers.length; i++) {
//     let latLon = ignitionMarkers[i].getLatLon();
//     if (latLon.length != 0) {
//       latLons.push(latLon);
//     }
//   }
//   if (latLons.length > 2) {
//     ignitionArea = L.polygon(latLons, {color: 'red'});
//     let centroid = ignitionArea.getBounds().getCenter();
//     latLons.sort((a, b) => {
//       let thetaA = Math.atan2((a[1] - centroid.lng) , (a[0] - centroid.lat));
//       let thetaB = Math.atan2((b[1] - centroid.lng) , (b[0] - centroid.lat));
//       if (thetaA > thetaB) {
//         return 1;
//       }
//       return -1;
//     });
//     map.removeLayer(ignitionArea);
//     ignitionArea = L.polygon(latLons, {color: 'orange'}).addTo(map);
//   }
// }

// function updateUIToIgnitionType() {
//   // L.DomUtil.removeClass(map._container,'pointer-cursor-enabled');
//   let ignitionType = $('#ignition-type').val();
//   if(ignitionType == IGNITION_TYPE_AREA) {
//     $('#ignition-perimeter-time').show();
//     while (ignitionTimes.length > 1) {
//       removeTimeOfIgnition();
//     }
//     ignitionTimes[0].hideIndex();
//     $('#ignition-times-count-field').hide();
//   } else {
//     $('#ignition-perimeter-time').hide();
//     $('#ignition-times-count-field').show();
//     ignitionTimes[0].showIndex();
//     updateTimesOfIgnition();
//   }
//   if(ignitionType == IGNITION_TYPE_LINE) {
//     while (ignitionMarkers.length > 1) removeIgnitionMarker();
//   }
//   updateIgnitionDataOnMap();
// }

// function updateTimesOfIgnition() {
//   let ignitionTimeCount = $('#ignition-times-count').val();
//   if(ignitionTimeCount == "single") {
//     while (ignitionTimes.length > 1) {
//       removeTimeOfIgnition();
//     }
//     ignitionTimes[0].hideIndex();
//   } else {
//     while (ignitionTimes.length < ignitionMarkers.length) {
//       createTimeOfIgnition();
//     }
//     ignitionTimes[0].showIndex();
//   }
// }

// function removeDrawnFeatures() {
//   if (ignitionArea != null) {
//     map.removeLayer(ignitionArea);
//     ignitionArea = null;
//   }
//   if (ignitionLine != null) {
//     map.removeLayer(ignitionLine);
//     ignitionLine = null;
//   }
// }

/** ===== SatelliteData block ===== */
async function showSatData() {
  if (satelliteMarkers.length == 0) {
    await getSatelliteData();
    createSatelliteMarkers();
  }
  if ($("#show-sat-data").prop("checked")) {
    addingSatData = true;
    addSatelliteMarkersInBatches();
  } else {
    addingSatData = false;
    removeSatelliteMarkersInBatches();
    // satelliteMarkers.map(marker => map.removeLayer(marker));
  }
}

function addSatelliteMarkersInBatches(
  index = 0,
  batchSize = SATELLITE_DATA_BATCH_SIZE,
) {
  if (!addingSatData) {
    return;
  }

  let batchEnd = Math.min(index + batchSize, satelliteMarkers.length);
  for (index; index < batchEnd; index++) {
    satelliteMarkers[index].addTo(map);
  }

  if (index < satelliteMarkers.length) {
    setTimeout(addSatelliteMarkersInBatches, TIMEOUT_MS, index, batchSize);
  } else {
    addingSatData = false;
  }
}

function removeSatelliteMarkersInBatches(
  index = 0,
  batchSize = SATELLITE_DATA_BATCH_SIZE,
) {
  if (addingSatData) {
    return;
  }

  let batchEnd = Math.min(index + batchSize, satelliteMarkers.length);
  for (index; index < batchEnd; index++) {
    map.removeLayer(satelliteMarkers[index]);
  }

  if (index < satelliteMarkers.length) {
    setTimeout(removeSatelliteMarkersInBatches, TIMEOUT_MS, index, batchSize);
  }
}

async function getSatelliteData() {
  try {
    const response = await fetch("/submit/sat_data");
    satelliteJSON = await response.json();
  } catch (error) {
    console.error("Error fetching satellite data: " + error);
  }
}

function createSatelliteMarkers() {
  let satIcon = L.icon({
    iconUrl: "static/square_icon_filled.png",
    iconSize: [7, 7],
    opacity: 0.8,
  });
  satelliteJSON["coordinates"].map((coordinates) => {
    let lat = coordinates["lat"];
    let lon = coordinates["lon"];
    let popUpString = "lat: " + lat + " lon: " + lon;
    let newMarker = L.marker([lat, lon], { icon: satIcon }).bindPopup(
      popUpString,
      { closeButton: false },
    );
    newMarker.on("mouseover", () => newMarker.openPopup());
    newMarker.on("mouseout", () => newMarker.closePopup());
    satelliteMarkers.push(newMarker);
  });
}

/** ===== FormSubmission block ===== */

// $('.form').submit((event) => {
//   event.preventDefault();
//   let formIsValid = isFormValid();
//   let [ignTimes, fcHours] = getTimesOfIgnitionAndDurations();
//   let [lats, lons] = getLatLons();
//   // let ignitionType = $('#ignition-type').val();
//   if(formIsValid) {
//     let formData = {
//       "description": $('#experiment-description').val(),
//       "ignition_type": $('#ignition-type').val(),
//       "ignition_latitude": lats,
//       "ignition_longitude": lons,
//       "ignition_time": ignTimes,
//       "fc_hours": fcHours,
//       "profile": $('#profile').val()
//     }
//     // if (ignitionType == IGNITION_TYPE_AREA) formData["perimeter_time"] = JSON.stringify($('#ign-time-perimeter').val());
//     $.ajax({
//         type:"post",
//         dataType: 'json',
//         data: formData
//       });
//   }
// });

function isFormValid() {
  // let ignitionTypeIsValid = isIgnitionTypeValid();
  let latLonsAreValid = areLatLonsValid();
  let descriptionIsValid = isDescriptionValid();
  let profileIsValid = isProfileValid();
  let timesOfIgnitionAreValid = areTimesOfIgnitionValid();
  // return ignitionTypeIsValid && latLonsAreValid && descriptionIsValid && profileIsValid && timesOfIgnitionAreValid;
  return (
    latLonsAreValid &&
    descriptionIsValid &&
    profileIsValid &&
    timesOfIgnitionAreValid
  );
}

// function isIgnitionTypeValid() {
//   let ignitionType = $('#ignition-type').val();
//   if (ignitionType == IGNITION_TYPE_AREA) {
//     if (ignitionMarkers.length < 3) {
//       $('#ignition-type-warning').addClass("activate-warning");
//       return false;
//     }
//   }
//   $('#ignition-type-warning').removeClass("activate-warning");
//   return true;
// }

function areLatLonsValid() {
  for (let ignitionMarker of ignitionMarkers) {
    if (!ignitionMarker.isValid()) {
      return false;
    }
  }
  return true;
}

function isDescriptionValid() {
  let description = $("#experiment-description").val();
  if (description == "") {
    $("#description-warning").addClass("activate-warning");
    return false;
  }
  $("#description-warning").removeClass("activate-warning");
  return true;
}

function isProfileValid() {
  let profile = $("#profile").val();
  if (profile == "") {
    $("#profile-warning").addClass("activate-warning");
    return false;
  }
  $("#profile-warning").removeClass("activate-warning");
  return true;
}

function areTimesOfIgnitionValid() {
  let areValid = true;
  for (let ignitionTime of ignitionTimes) {
    if (!ignitionTime.isValid()) {
      areValid = false;
    }
  }
  if ($("#ignition-type").val() == IGNITION_TYPE_AREA) {
    if (!isValidTime($("#ign-time-perimeter").val())) {
      areValid = false;
      $(`#ignition-time-warning-perimeter`).addClass("activate-warning");
    } else {
      $(`#ignition-time-warning-perimeter`).removeClass("activate-warning");
    }
  }
  return areValid;
}

function isValidTime(ign_time_value) {
  let ignTime = moment.utc(ign_time_value, "MMM D,YYYY h:mm a");
  if (!ignTime.isValid() || ignTime.year() < 1979) {
    return false;
  }
  return true;
}

function getTimesOfIgnitionAndDurations() {
  let igns = [];
  let fcHours = [];
  // let ignTimeAndDuration = ignitionTimes[0].getIgnitionTimeAndDuration();
  // igns.push(ignTimeAndDuration[0]);
  // fcHours.push(ignTimeAndDuration[1]);
  // for (let i = 1; i < ignitionMarkers.length; i++) {
  //   // If an area we dont want to post multiple ignitions
  //   if ($('#ignition-type').val() == IGNITION_TYPE_MULTIPLE) {
  //     if ($('#ignition-times-count').val() == MULTIPLE_IGNITION_TIMES) {
  //       ignTimeAndDuration = ignitionTimes[i].getIgnitionTimeAndDuration();
  //     }
  //     igns.push(ignTimeAndDuration[0]);
  //     fcHours.push(ignTimeAndDuration[1]);
  //   }
  // }
  return [JSON.stringify(igns), JSON.stringify(fcHours)];
}

function getLatLons() {
  let latitudes = [];
  let longitudes = [];
  // for (let ignitionMarker of ignitionMarkers) {
  //   let [lat, lon] = ignitionMarker.getLatLon();
  //   latitudes.push(lat);
  //   longitudes.push(lon);
  // }
  return [JSON.stringify(latitudes), JSON.stringify(longitudes)];
}
