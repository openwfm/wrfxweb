import { controllers } from './components/Controller.js';
import { simVars } from './simVars.js';
import { map } from './map.js';
import { ISMOBILE } from './app.js';

/** Utility functions that can be imported and used in components from anywhere. 
 * 
 *        Contents
 *    - Constants block
 *    - SetURL block
 *    - Debounce block
 *    - TimeConversion block
 *    - CreateDomElements block
 *    - Color block
 *    - Drag Elements block
 * 
 */

/** ===== Constants block */
export const CLIENT_WIDTH = document.body.clientWidth;
export const IS_MOBILE = CLIENT_WIDTH < 769; 
export var ELEMENT_FOCUSED = false;

/** ===== SetURL block ===== */
export function setURL() {
  let historyData = {};
  let urlVars = '';

  const addData = (key, data) => {
    if (data) {
      historyData[key] = data;
      urlVars += '&' + key + '=' + data;
    }
  }

  zoomToURL(addData);
  panToURL(addData);
  jobIdToURL(addData);
  domainToURL(addData);
  startDateToURL(addData);
  endDateToURL(addData);
  timestampToURL(addData);
  addedLayersToURL(addData);
  opacityToURL(addData);

  if (urlVars != '') {
    urlVars = '?' + urlVars.substr(1);
    history.pushState(historyData, 'Data', urlVars);
  }
}

function zoomToURL(addData) {
  let zoom = map.getZoom();
  addData('zoom', zoom);
}

function panToURL(addData) {
  let center = map.getCenter();
  let pan = center.lat.toFixed(2) + ',' + center.lng.toFixed(2);
  addData('pan', pan);
}

function jobIdToURL(addData) {
  let currentSimulation = simVars.currentSimulation;
  addData('job_id', currentSimulation);
}

function domainToURL(addData) {
  let currentDomain = controllers.currentDomain.getValue();
  let domainInstances = controllers.domainInstance.getValue();
  if (domainInstances != null && domainInstances.length > 0 && currentDomain != domainInstances[0]) {
    addData('domain', currentDomain);
  }
}

function startDateToURL(addData) {
  let startDate = controllers.startDate.getValue();
  if (startDate != simVars.sortedTimestamps[0]) {
    addData('startDate', utcToLocal(startDate));
  }
}

function endDateToURL(addData) {
  let endDate = controllers.endDate.getValue();
  let nTimestamps = simVars.sortedTimestamps.length;
  if (endDate != simVars.sortedTimestamps[nTimestamps - 1]) {
    addData('endDate', utcToLocal(endDate));
  }
}

function timestampToURL(addData) {
  let timestamp = controllers.currentTimestamp.getValue();
  if (timestamp != startDate) {
    addData('timestamp', utcToLocal(timestamp));
  }
}

function addedLayersToURL(addData) {
  let rasterURL = simVars.overlayOrder.join(',');
  addData('rasters', rasterURL);
}

function opacityToURL(addData) {
  let opacity = controllers.opacity.getValue();
  if (opacity != 0.5) {
    addData('opacity', opacity);
  }
}

/** ===== Debounce block ===== */
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

/** ===== TimeConversion block ===== */
/** Function to convert UTC timestamp to PT timestamp. */
export function utcToLocal(utcTime) {
  if (!utcTime) {
    return;
  }
  let timezone = 'America/Los_Angeles';
  let localTime = dayjs(utcTime.replace('_', 'T') + 'Z');

  return localTime.format('YYYY-MM-DD HH:mm:ss', {timeZone: timezone});
}

export function localToUTC(localTime) {
  if (!localTime) {
    return;
  }
  let timezone = 'America/Los_Angeles';
  let localTimeDayJS = dayjs(localTime).tz(timezone);
  let utcTime = localTimeDayJS.tz('UTC');

  return utcTime.format('YYYY-MM-DD_HH:mm:ss');
}

export function daysBetween(timestamp1, timestamp2) {
  let date1 = dayjs(timestamp1);
  let date2 = dayjs(timestamp2);
  let diff = date1.diff(date2, 'day');
  return Math.abs(diff);
}

export function getNewTimestamp(prevTimestamps, nextTimestamps, timestamp) {
    if (nextTimestamps.includes(timestamp)) {
        return timestamp;
    }
    let prevIndex = prevTimestamps.indexOf(timestamp);
    let percentage = prevIndex / prevTimestamps.length;
    let newIndex = Math.floor(nextTimestamps.length * percentage);

    return nextTimestamps[newIndex];
}

/** ===== CreateDomElements block ===== */
export function createOption(timeStamp, utcValue) {
  let option = document.createElement('option');
  option.value = timeStamp;
  let innerText = utcValue ? utcToLocal(timeStamp) : timeStamp;
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

/** Creates the htmlElement for each checkbox in the LayerController. */
export function buildCheckBox({id, type, name, checked, callback, args=null, text}) {
  let div = document.createElement('div');
  div.className = 'layer-checkbox';

  const input = document.createElement('input');
  input.id = id;
  input.name = name;
  input.type = type;
  input.checked = checked;
  input.onclick = () => {
    callback(args);
  }

  let label = document.createElement('label');
  label.for = id;
  label.innerText = text;
  div.appendChild(input);
  div.appendChild(label);
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

/** ===== Color block ===== */
// pulled from https://www.w3docs.com/snippets/javascript/how-to-convert-rgb-to-hex-and-vice-versa.html
export function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function darkenHex(hex) {
  let darkenedHex = '#';
  for (let decimal of hex.substr(1)) {
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

/** ===== DragElements block ===== */
export function isolateFocus(element) {
  element.onfocus = () => {
    ELEMENT_FOCUSED = true;
  }
  element.onblur = () => {
    ELEMENT_FOCUSED = false;
  }
}

/** A custom double click implementation needed to handle double clicking on ios. */
export function doubleClick(elmnt, doubleClickFunction) {
  const DOUBLE_CLICK_MS = 200;
  const MAX_DOUBLE_CLICK_DIST = 30;
  let timeout = null;
  let previousE;
  elmnt.addEventListener('pointerdown', (e) => {
    if (timeout != null) {
      let xDiff = Math.abs(e.clientX - previousE.clientX);
      let yDiff = Math.abs(e.clientY - previousE.clientY);
      if ((xDiff + yDiff) > MAX_DOUBLE_CLICK_DIST) {
        timeout = null;
        previousE = null;
        return;
      }
      e.stopPropagation();
      clearTimeout(timeout);
      timeout = null;
      previousE = null;
      doubleClickFunction(e);
    } else {
      previousE = e;
      timeout = setTimeout(() => {
        timeout = null;
      }, DOUBLE_CLICK_MS);
    }
  });
}

/** Makes given element draggable from sub element with id 'subID' */
export function dragElement(elmnt, subID='', mobileEnabled=false) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let elmntLeft = 0, elmntTop = 0;
  let clientWidth = document.body.clientWidth, clientHeight = document.body.clientHeight;

  let draggableElement = document.getElementById(elmnt.id);
  if (subID != '') {
    draggableElement = document.getElementById(subID);
  }
  // document.getElementById(elmnt.id + subID).onpointerdown = dragMouseDown;
  // draggableElement.onpointerdown = dragMouseDown;
  draggableElement.addEventListener('pointerdown', dragMouseDown);
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
    if (ISMOBILE && !mobileEnabled) {
      return;
    }
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
