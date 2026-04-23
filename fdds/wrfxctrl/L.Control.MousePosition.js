  /* based on github.com/ardhi/Leaflet.MousePosition (MIT license) */
// var timer = 0;
// var prevent = false;

// L.Control.MousePosition = L.Control.extend({
//   options: {
//     position: 'bottomleft',
//     separator: ' : ',
//     emptyString: '',
//     lngFirst: false,
//     numDigits: 4
//   },

//   onAdd: function (map) {
//     this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
//     L.DomEvent.disableClickPropagation(this._container);
//     map.on('mousemove', this._onMouseMove, this);
//     map.on('click', this._onMouseClick, this);
//     map.on('dblclick', this._onMouseDoubleClick, this);
//     this._container.innerHTML=this.options.emptyString;
//     this._freeze = false;
//     return this._container;
//   },

//   onRemove: function (map) {
//     map.off('mousemove', this._onMouseMove)
//   },

//   _onMouseMove: function (e) {
//     var lng = L.Util.formatNum(e.latlng.lng, this.options.numDigits);
//     var lat = L.Util.formatNum(e.latlng.lat, this.options.numDigits);
//     var value = this.options.lngFirst ? lng + this.options.separator + lat : lat + this.options.separator + lng;
//     var prefixAndValue = 'Location ' + value;
//     this._container.innerHTML = prefixAndValue;
//   },
  
//   _onMouseClick: function(e) {
//     timer = setTimeout(() => {
//       if (!prevent) {
//         var lat = L.Util.formatNum(e.latlng.lat, this.options.numDigits);
//         var lon = L.Util.formatNum(e.latlng.lng, this.options.numDigits);
//         if ($('#add-buffer-line').prop('checked')) {
//           bufferFields[bufferGroup][bufferId].addMarkerToMapAtLatLon(lat, lon);
//         // } else ignitionMarkers[activeMarkerId].addMarkerToMapAtLatLon(lat, lon);
//         }
//       }
//       prevent = false;
//     }, 200)
//   },

//   _onMouseDoubleClick: function(e) {
//     prevent = true;
//     clearTimeout(timer);
//     var lat = L.Util.formatNum(e.latlng.lat, this.options.numDigits);
//     var lon = L.Util.formatNum(e.latlng.lng, this.options.numDigits);
//     console.log(appState)
//     if (isMarkerTypePerimeter()) {
//       if (perimeterMarkers[activePerimeterId].getLatLon().length == 2) createPerimeterMarker();
//       perimeterMarkers[activePerimeterId].addMarkerToMapAtLatLon(lat, lon);
//     }
//     else {
//       if (ignitionMarkers[activeMarkerId].getLatLon().length == 2) createIgnitionMarker();
//       ignitionMarkers[activeMarkerId].addMarkerToMapAtLatLon(lat, lon);
//     }
//   }
// });

// L.Map.mergeOptions({
//     positionControl: false
// });

// L.Map.addInitHook(function () {
//     if (this.options.positionControl) {
//         this.positionControl = new L.Control.MousePosition();
//         this.addControl(this.positionControl);
//     }
// });

// L.control.mousePosition = function (options) {
//     return new L.Control.MousePosition(options);
// };
