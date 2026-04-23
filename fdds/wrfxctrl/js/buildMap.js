export const buildMap = (function makeSimState() {
  class BuildMap {
    constructor() {
      this.map = this.initializeMap();
      this.subscribers = [];
    }

    baseLayerDict() {
      return {
        MapQuest: MQ.mapLayer(),
        "MQ Satellite": L.tileLayer(
          "http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png",
          {
            attribution: "Data and imagery by MapQuest",
            subdomains: ["otile1", "otile2", "otile3", "otile4"],
          },
        ),
        OSM: L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        }),
      };
    }

    initializeMap() {
      const baseLayerDict = {
        MapQuest: MQ.mapLayer(),
        "MQ Satellite": L.tileLayer(
          "http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png",
          {
            attribution: "Data and imagery by MapQuest",
            subdomains: ["otile1", "otile2", "otile3", "otile4"],
          },
        ),
        OSM: L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        }),
      };
      // initialize map
      map = L.map("map", {
        center: [37.5, -119.5],
        zoom: 5,
        layers: [baseLayerDict["OSM"]],
        zoomControl: true,
        minZoom: 3,
      });

      L.DomUtil.addClass(map._container, "pointer-cursor-enabled");
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();

      // add lon/lat display to bottom left corner of map
      // L.control.mousePosition().addTo(map);

      map.on("dblclick", (e) => {
        var lat = L.Util.formatNum(e.latlng.lat, map.options.numDigits);
        var lon = L.Util.formatNum(e.latlng.lng, map.options.numDigits);
        for (let subscriber of this.subscribers) {
          subscriber.createAndAddMarker(lat, lon);
        }
      });

      return map;
    }

    subscribeComponent(component) {
      if (component.createAndAddMarker) {
        this.subscribers.push(component);
      }
    }

    drawArea(latLons, color = "red") {
      let polygon = null;
      if (latLons.length > 2) {
        // ignitionArea = L.polygon(latLons);
        // let centroid = ignitionArea.getBounds().getCenter();
        // latLons.sort((a, b) => {
        //     let thetaA = Math.atan2((a[1] - centroid.lng) , (a[0] - centroid.lat));
        //     let thetaB = Math.atan2((b[1] - centroid.lng) , (b[0] - centroid.lat));
        //     if (thetaA > thetaB) {
        //     return 1;
        //     }
        //     return -1;
        // });
        polygon = L.polygon(latLons, { color: color }).addTo(this.map);
      }
      return polygon;
    }

    drawLine(latLons, color = "red") {
      let polygon = null;
      if (latLons.length > 1) {
        polygon = L.polyline(latLons, { color: color }).addTo(map);
      }
      return polygon;
    }
  }

  return new BuildMap();
})();
