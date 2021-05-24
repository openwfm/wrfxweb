export const baseLayerDict = {
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
export const map = L.map('map-fd', {
    center: [37.34, -121.89],
    zoom: 7,
    layers: [baseLayerDict['OSM']],
    zoomControl: true,
    minZoom: 3
});

// Set needed global variables 
export const simVars = {
  currentSimulation: "",
  rasters: [],
  rasterBase: "",
  sortedTimestamps: [],
  overlayOrder: [],
  displayedColorbar: null,
  organization: null,
  overlayList: ['WINDVEC', 'WINDVEC1000FT', 'WINDVEC4000FT', 'WINDVEC6000FT', 'SMOKE1000FT', 'SMOKE4000FT', 'SMOKE6000FT', 'FIRE_AREA', 'SMOKE_INT', 'FGRNHFX', 'FLINEINT'],
};

export function debounce(callback, delay) {
  let timeout; 
  return function() {
    if (timeout) {
      return;
    }
    const callbackInIntervals = () => {
      timeout = null;
      callback();
    };
    timeout = setTimeout(callbackInIntervals, delay);
  }
}

/** Function to convert UTC timestamp to PT timestamp. */
export function utcToLocal(utcTime) {
  var timezone = "America/Los_Angeles";
  var a = dayjs(utcTime.replace('_', 'T') + 'Z').tz(timezone);
  return a.format("YYYY-MM-DD HH:mm:ss");
}

export function createOption(timeStamp, utcValue) {
  var option = document.createElement('option');
  option.value = timeStamp;
  var innerText = utcValue ? utcToLocal(timeStamp) : timeStamp;
  option.innerText = innerText;
  return option;
}

export function linkSelects(selectStart, selectEnd) {
  selectStart.childNodes.forEach(startOption => {
    startOption.disabled = false;
    if (startOption.value > selectEnd.value) {
      startOption.disabled = true;
    }
  });
  selectEnd.childNodes.forEach(endOption => {
    endOption.disabled = false;
    if (endOption.value < selectStart.value) {
      endOption.disabled = true;
    }
  });
}

/** Makes given element draggable from sub element with id "subID" */
export function dragElement(elmnt, subID) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  var elmntLeft = 0, elmntTop = 0;
  var clientWidth = document.body.clientWidth, clientHeight = document.body.clientHeight;
  if (clientWidth < 769) {
    return;
  }
  document.getElementById(elmnt.id + subID).onpointerdown = dragMouseDown;
  window.addEventListener("resize", () => {
    let offsetLeft = clientWidth - document.body.clientWidth;
    if (elmntLeft != 0 && elmnt.offsetLeft + (elmnt.clientWidth / 2) > (document.body.clientWidth / 2) && (elmntLeft - offsetLeft) > 0) {
      elmntLeft = elmntLeft - offsetLeft; 
      elmnt.style.left = elmntLeft + "px";
    }
    let offsetTop = clientHeight - document.body.clientHeight;
    if (elmntTop != 0 && elmnt.offsetTop + (elmnt.clientHeight / 2) > (document.body.clientHeight / 2) && (elmntTop - offsetTop) > 0 && (elmntTop - offsetTop + elmnt.clientHeight) < document.body.clientHeight) {
      elmntTop = elmntTop - offsetTop;
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
