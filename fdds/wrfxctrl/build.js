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
function set_profile_text(txt) {
  $("#profile-info-text").text(txt);
}

// initialize Semantic elements
$("#profile-dropdown").dropdown({ on: "hover" });
$("#show-sat-data").prop("checked", false);
$("#show-sat-data").click(showSatData);
$("#buffer-type").dropdown();
$(".ui.menu").on("click", ".item", function() {
  $(this).addClass("active").siblings(".item").removeClass("active");
});
// Fill in a 'unique description'
$("#experiment-description").text(
  "Web initiated forecast at " + moment().format(),
);

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

function isFormValid() {
  let latLonsAreValid = areLatLonsValid();
  let descriptionIsValid = isDescriptionValid();
  let profileIsValid = isProfileValid();
  let timesOfIgnitionAreValid = areTimesOfIgnitionValid();
  return (
    latLonsAreValid &&
    descriptionIsValid &&
    profileIsValid &&
    timesOfIgnitionAreValid
  );
}

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
  return [JSON.stringify(igns), JSON.stringify(fcHours)];
}

function getLatLons() {
  let latitudes = [];
  let longitudes = [];

  return [JSON.stringify(latitudes), JSON.stringify(longitudes)];
}
