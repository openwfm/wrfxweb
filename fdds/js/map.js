import { getConfigurations } from "./services.js";
import { simVars } from "./simVars.js";

// construct map with the base layers
export const map = (function buildMap() {
  let center = [39.7392, -104.9903];
  let presetCenter = simVars.presets.pan;
  if (presetCenter && presetCenter.length == 2) {
    center = presetCenter;
  } else if (simVars.organization.includes("SJSU")) {
    center = [37.34, -121.89];
  }
  let zoom = 7;
  let presetZoom = simVars.presets.zoom;
  if (presetZoom && !isNaN(presetZoom)) {
    zoom = presetZoom;
  }
  let leafletMap = L.map("map-fd", {
    keyboard: false,
    layers: [simVars.baseLayerDict["OSM"]],
    zoomControl: true,
    minZoom: 3,
    center: center,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    zoom: zoom,
  });
  // Add a custom logo to the map
  L.LogoControl = L.Control.extend({
    options: {
      position: "bottomleft",
      // control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
    },
    onAdd: function(map) {
      var container = L.DomUtil.create("div", "logo-control");
      var button = L.DomUtil.create("div", "logo-div");
      container.appendChild(button);
      button.id = "logo-div";
      button.innerHTML =
        '<img id="logo-img" height="30px" class="logo-control-img" src="imgs/logo.png">';
      L.DomEvent.disableClickPropagation(button);
      container.title = "WIRC";
      // Add click event listener for redirection
      L.DomEvent.on(button, "click", function() {
        // URL to reroute to
        window.location.href = "https://www.wildfirecenter.org";
      });
      return container;
    },
  });
  new L.LogoControl().addTo(leafletMap);

  leafletMap.doubleClickZoom.disable();
  leafletMap.scrollWheelZoom.disable();

  // add scale & zoom controls to the map
  L.control.scale({ position: "bottomright" }).addTo(leafletMap);

  return leafletMap;
})();
