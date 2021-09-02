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
  // addData('domain', currentDomain);
  // var timestamp = utcToLocal(controllers.currentTimestamp.getValue());
  // addData('timestamp', timestamp);
  // var startDate = utcToLocal(controllers.startDate.getValue());
  // addData('startDate', startDate);
  // var endDate = utcToLocal(controllers.endDate.getValue());
  // addData('endDate', endDate);
  // var rasterURL = simVars.overlayOrder.join('-');
  var domainInstances = controllers.domainInstance.getValue();
  if (domainInstances != null && domainInstances.length > 0 && currentDomain != domainInstances[0]) {
    addData('domain', currentDomain);
  }
  var startDate = controllers.startDate.getValue();
  if (startDate != simVars.sortedTimestamps[0]) {
    addData('startDate', utcToLocal(startDate));
  }
  var endDate = controllers.endDate.getValue();
  var nTimestamps = simVars.sortedTimestamps.length;
  if (endDate != simVars.sortedTimestamps[nTimestamps - 1]) {
    addData('endDate', utcToLocal(endDate));
  }
  var timestamp = controllers.currentTimestamp.getValue();
  if (timestamp != startDate) {
    addData('timestamp', utcToLocal(timestamp));
  }
  var rasterURL = simVars.overlayOrder.join(',');
  addData('rasters', rasterURL);
  var opacity = controllers.opacity.getValue();
  if (opacity != 0.5) {
    addData('opacity', opacity);
  }
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
  if (!utcTime) {
    return;
  }

  var timezone = 'America/Los_Angeles';
  var localTime = dayjs(utcTime.replace('_', 'T') + 'Z');

  return localTime.format('YYYY-MM-DD HH:mm:ss', {timeZone: timezone})
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

/** Makes given element draggable from sub element with id 'subID' */
export function dragElement(elmnt, subID) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  var elmntLeft = 0, elmntTop = 0;
  var clientWidth = document.body.clientWidth, clientHeight = document.body.clientHeight;
  if (clientWidth < 769) {
    return;
  }
  document.getElementById(elmnt.id + subID).onpointerdown = dragMouseDown;
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
    document.onpointerup = null;
    document.onpointermove = null;
  }
}
