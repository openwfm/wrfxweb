

var mpq_layer = L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                            attribution: 'Data and imagery by MapQuest',
                            subdomains: ['otile1','otile2','otile3','otile4']
        });

  // construct map of domain with MapQuest base
var dmap = L.map('map-domains', {center: [39,-106], layers: [mpq_layer] });

var domsl = new L.KML('data/colo3d.kml', {async: true})
  .on('loaded', function(e) { dmap.fitBounds(e.target.getBounds())})
  .addTo(dmap);

var mpq_layer2 = L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                            attribution: 'Data and imagery by MapQuest',
                            subdomains: ['otile1','otile2','otile3','otile4']
        });

var psmap = L.map('map-patch-springs', {center: [40.475640, -112.652527], layers: [mpq_layer2] });
psmap.fitBounds([[40.3, -112.70],[40.5, -112.55]]);

$.getJSON("data/patch_springs_fd_15th.json", function( data ) {
  L.geoJson(data, {
    style: {
      "color": "#ff9933",
      "weight": 2,
      "opacity": 1,
      "fillOpacity": 0}
    }).addTo(psmap).bringToFront();
});
