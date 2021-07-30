import { controllers } from './components/Controller.js';
import { simVars } from './simVars.js';
import { map } from './map.js';

export function setURL() {
  var historyData = {};
  var urlVars = '';

  const addData = (key, data) => {
    if (data) {
      historyData[key] = data;
      urlVars += '&' + key + '=' + data;
    }
  }

  var zoom = map.getZoom();
  addData('zoom', zoom);
  var center = map.getCenter();
  var pan = center.lat.toFixed(2) + ',' + center.lng.toFixed(2);
  addData('pan', pan);
  var currentSimulation = simVars.currentSimulation;
  addData('job_id', currentSimulation);
  var currentDomain = controllers.currentDomain.getValue();
  addData('domain', currentDomain);
  var timestamp = utcToLocal(controllers.currentTimestamp.getValue());
  addData('timestamp', timestamp);
  var startDate = utcToLocal(controllers.startDate.getValue());
  addData('startDate', startDate);
  var endDate = utcToLocal(controllers.endDate.getValue());
  addData('endDate', endDate);
  var rasterURL = simVars.overlayOrder.join(',');
  addData('rasters', rasterURL);
  var opacity = controllers.opacity.getValue();
  addData('opacity', opacity);

  if (urlVars != '') {
    urlVars = '?' + urlVars.substr(1);
    history.pushState(historyData, 'Data', urlVars);
  }
}

map.on('zoomend', function() {
  setURL();
});

map.on('moveend', function() {
  setURL();
});

/** Executes function with a maximum rate of delay. */
export function debounceInIntervals(callback, delay) {
  let timeout; 
  return function(args=null) {
    if (timeout) {
      return;
    }
    callback(args);
    const callbackInIntervals = () => {
      timeout = null;
    };
    timeout = setTimeout(callbackInIntervals, delay);
  }
}

/** Executes a function once at the end of an update cycle lasting delay. */
export function debounce(callback, delay) {
  let timeout;
  return function(args=null) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => callback(args), delay);
  }
}

/** Function to convert UTC timestamp to PT timestamp. */
export function utcToLocal(utcTime) {
  if (!utcTime) {
    return;
  }

  var timezone = 'America/Los_Angeles';
  var localTime = dayjs(utcTime.replace('_', 'T') + 'Z').tz(timezone);

  return localTime.format('YYYY-MM-DD HH:mm:ss');
}

export function localToUTC(localTime) {
  if (!localTime) {
    return;
  }

  var timezone = 'America/Los_Angeles';
  var localTimeDayJS = dayjs(localTime).tz(timezone);
  var utcTime = localTimeDayJS.tz('UTC');

  return utcTime.format('YYYY-MM-DD_HH:mm:ss');
}

export function createOption(timeStamp, utcValue) {
  var option = document.createElement('option');
  option.value = timeStamp;
  var innerText = utcValue ? utcToLocal(timeStamp) : timeStamp;
  option.innerText = innerText;
  return option;
}

export function createElement(id=null, className=null) {
    const div = document.createElement('div');
    if (id) {
        div.id = id;
    }
    if (className) {
        div.className = className;
    }
    return div;
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

// pulled from https://www.w3docs.com/snippets/javascript/how-to-convert-rgb-to-hex-and-vice-versa.html
export function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function darkenHex(hex) {
  var darkenedHex = '#';
  for (var decimal of hex.substr(1)) {
      switch (decimal) {
          case 'f': 
              darkenedHex += 'd';
              break;
          case 'e': 
              darkenedHex += 'c';
              break;
          case 'd':
              darkenedHex += 'b';
              break;
          case 'c':
              darkenedHex += 'a';
              break;
          case 'b':
              darkenedHex += '0';
              break;
          case 'a': 
              darkenedHex += '8';
              break;
          case '0': 
              darkenedHex += 'e';
              break;
          case '1': 
              darkenedHex += 'f';
              break;
          default:
              darkenedHex += Number(decimal) - 2;
      }
  }
  return darkenedHex;
}

/** Makes given element draggable from sub element with id 'subID' */
export function dragElement(elmnt, subID) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  var elmntLeft = 0, elmntTop = 0;
  var clientWidth = document.body.clientWidth, clientHeight = document.body.clientHeight;
  if (clientWidth < 769) {
    return;
  }
  var draggableElement = document.getElementById(elmnt.id);
  if (subID != '') {
    draggableElement = document.getElementById(subID);
  }
  // document.getElementById(elmnt.id + subID).onpointerdown = dragMouseDown;
  draggableElement.onpointerdown = dragMouseDown;
  window.addEventListener('resize', () => {
    let offsetLeft = clientWidth - document.body.clientWidth;
    if (elmntLeft != 0 && elmnt.offsetLeft + (elmnt.clientWidth / 2) > (document.body.clientWidth / 2) && (elmntLeft - offsetLeft) > 0) {
      elmntLeft = elmntLeft - offsetLeft; 
      elmnt.style.left = elmntLeft + 'px';
    }
    let offsetTop = clientHeight - document.body.clientHeight;
    if (elmntTop != 0 && elmnt.offsetTop + (elmnt.clientHeight / 2) > (document.body.clientHeight / 2) && (elmntTop - offsetTop) > 0 && (elmntTop - offsetTop + elmnt.clientHeight) < document.body.clientHeight) {
      elmntTop = elmntTop - offsetTop;
      elmnt.style.top = elmntTop + 'px';
    }
    clientWidth = document.body.clientWidth;
    clientHeight = document.body.clientHeight;
  })

  function dragMouseDown(e) {
    document.body.classList.add('grabbing');
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
      elmnt.style.left = elmntLeft + 'px';
    }
    if (Math.abs(pos2) >= 1 && elmntTop - pos2 > 0 && elmntTop + elmnt.clientHeight - pos2  < clientHeight) {
      elmntTop = elmntTop - pos2;
      elmnt.style.top = elmntTop + 'px';
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.body.classList.remove('grabbing');
    document.onpointerup = null;
    document.onpointermove = null;
  }
}
