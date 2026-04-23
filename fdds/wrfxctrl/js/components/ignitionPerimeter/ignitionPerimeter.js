import { appState } from '../../appState.js';
import { IgnitionPerimeterUI } from './ignitionPerimiterUI/ignitionPerimeterUI.js';
import { IgnitionMarker } from '../ignitionMarker.js';
import { buildMap } from '../../buildMap.js';
import { validateIgnitionMarkers, jsonLatLons } from '../validationUtils.js';

export class IgnitionPerimeter extends IgnitionPerimeterUI {
    constructor() {
        super();
        this.perimeterMarkers = [];
        this.perimeterPolygon = null;
        this.perimeterLine = null;
        this.currentMarker = null;
        this.lastMarker = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.createPerimeterMarker();
        document.addEventListener("keydown", (event) => {
          if (appState.isPerimeter() && event.key == "Backspace") {
            let index = this.perimeterMarkers.indexOf(this.currentMarker);
            this.removeMarker(index);
          }
        });
    }

    addKmlPoints() {
      if ( !appState.isPerimeter() ) {
        return;
      }
      this.removeAllMarkers();
      const { kmlPoints } = appState;
      for (let kmlPoint of kmlPoints) {
        let { lat, lon } = kmlPoint;
        this.createAndAddMarker(lat, lon, true);
      }
      this.addPolygon();
      let centroid = this.perimeterPolygon.getBounds().getCenter();
      buildMap.map.setView(new L.LatLng(centroid.lat, centroid.lng), 12);
    }

    createPerimeterMarker() {
        let newFieldId = 0;
        if ( this.currentMarker ) {
            newFieldId = this.perimeterMarkers.indexOf(this.currentMarker) + 1;
        }
        const newMarkerField = new IgnitionMarker(newFieldId, this, "orange");
        this.currentMarker = newMarkerField;
        this.perimeterMarkers.splice(this.currentMarker.index, 0, newMarkerField);
    }

    createAndAddMarker(lat, lon, kml=false) {
        if (!appState.isPerimeter()) { 
            return 
        } else if (this.currentMarker.getLatLon().length == 2) {
            this.lastMarker = this.currentMarker;
            this.lastMarker.setMarkerOriginalColor();
            this.createPerimeterMarker();
        }
        this.currentMarker.addMarkerToMapAtLatLon(lat, lon);
        this.currentMarker.setMarkerBlack();
        this.updateIndices();
        if ( !kml ) {
          this.updateMapLayer();
        }
    }

    updateMapLayer() {
      if (this.perimeterMarkers.length > 2) {
        this.addPolygon();
      } else {
        this.addPerimeterLine();
      }
    }

    updateIndices() {
      const { perimeterMarkersListUI } = this.uiElements;
      this.clearMarkerList();
      let i = 0;
      for (let marker of this.perimeterMarkers) {
        marker.updateIndex(i);
        i++;
        perimeterMarkersListUI.append(marker);
      }
    }

    clearMarkerList() {
      const { perimeterMarkersListUI } = this.uiElements;
      while (perimeterMarkersListUI.firstChild) {
        perimeterMarkersListUI.removeChild(perimeterMarkersListUI.firstChild);
      }
    }

    clickMarker(marker) {
        if (this.currentMarker != marker) {
          this.currentMarker.setMarkerOriginalColor();
          this.lastMarker = this.currentMarker;
          this.currentMarker = marker;
          marker.setMarkerBlack();
        }
    }

    doubleClickMarker(marker) {
      let firstMarker = this.perimeterMarkers[0];
      if (marker == firstMarker && this.perimeterLine) {
        this.addPolygon();
      }
    }
  
    markerLatLons() {
      let latLons = [];
      for (let perimeterMarker of this.perimeterMarkers) {
        let latLon = perimeterMarker.getLatLon();
        if (latLon.length != 0) {
          latLons.push(latLon);
        }
      }
      return latLons;
    }

    addPolygon() {
      if (this.perimeterLine) {
        buildMap.map.removeLayer(this.perimeterLine);
        this.perimeterLine = null;
      }
      if (this.perimeterPolygon) {
        buildMap.map.removeLayer(this.perimeterPolygon);
      }
      this.perimeterPolygon = buildMap.drawArea(this.markerLatLons(), 'orange');
    }

    addPerimeterLine() {
      if (this.perimeterPolygon) {
        buildMap.map.removeLayer(this.perimeterPolygon);
        this.perimeterPolygon = null;
      }
      if (this.perimeterLine) {
        buildMap.map.removeLayer(this.perimeterLine);
      }
      this.perimeterLine = buildMap.drawLine(this.markerLatLons(), 'orange');
    }

    markerUpdate() {
      this.updateMapLayer();
    }

    markerClicked(marker) {
      this.lastMarker = marker;
    }

    clearLastMarker() {
      const lastMarker = this.lastPointsMarker();
      if (lastMarker.mapMarker) {
            buildMap.map.removeLayer(lastMarker.mapMarker);
        }
      lastMarker.clearLatLon();
    }

    lastPointsMarker() {
        return this.perimeterMarkers.slice(-1)[0];
    }

    removeMarker(index) {
        if (this.perimeterMarkers.length == 0) {
            return;
        }
        if (this.perimeterMarkers.length == 1) {
            this.clearLastMarker();
            return;
        }
        const markerToRemove = this.perimeterMarkers[index];
        for (let i = index + 1; i < this.perimeterMarkers.length; i++ ) {
            this.perimeterMarkers[i].updateIndex(i - 1);
        }
        this.perimeterMarkers.splice(index, 1);
        if (markerToRemove.mapMarker) {
            buildMap.map.removeLayer(markerToRemove.mapMarker);
        }
        if (index == 0) {
          this.currentMarker = this.perimeterMarkers[this.perimeterMarkers.length - 1];
        } else {
          this.currentMarker = this.perimeterMarkers[index - 1];
        }
        this.currentMarker.setMarkerBlack();
        markerToRemove.remove();
        markerToRemove.clearLatLon();
        this.markerUpdate();
    }

    removeAllMarkers() {
      while ( this.perimeterMarkers.length > 1 ) {
        this.removeMarker(0)
      }
      this.removeMarker(0)
    }

    validateForIgnition() {
        let errorMessages = [];
        if (!this.perimeterPointsAdded()) {
            return {header: "Burn Plot Boundary", messages: errorMessages};
        }

        let ignitionMarkerErrorMessage = validateIgnitionMarkers(this.perimeterMarkers);
        if (ignitionMarkerErrorMessage) {
            errorMessages.push(ignitionMarkerErrorMessage);
        }

        let numberOfMarkersErrorMessage = this.validateNumberOfMarkers();
        if (numberOfMarkersErrorMessage) {
            errorMessages.push(numberOfMarkersErrorMessage);
        }

        return {header: "Burn Plot Boundary", messages: errorMessages};
    }

    validateNumberOfMarkers() {
        let errorMessage = 'There must be at least 3 markers to define a Perimeter.';
        if (this.perimeterMarkers.length < 3) {
            return errorMessage;
        }
    }

    perimeterPointsAdded() {
        return this.perimeterMarkers.length > 1 || this.currentMarker.isSet();
    }

    jsonProps() {
        if (!this.perimeterPointsAdded()) {
            return {
                "ignition_perimeter_lats": "[]",
                "ignition_perimeter_lons": "[]",
            };
        }
        let [lats, lons] = jsonLatLons(this.perimeterMarkers);
        return {
            "ignition_perimeter_lats": lats,
            "ignition_perimeter_lons": lons,
        }
    }
}

window.customElements.define('ignition-perimeter', IgnitionPerimeter);
