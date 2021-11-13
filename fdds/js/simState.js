import { configData } from './app.js';
import { getSimulationRasters } from './services.js';
import { localToUTC, daysBetween } from './util.js';

export const simState = (function makeSimState() {
    class SimState {
        getPresets() {
            const urlParams = new URLSearchParams(window.location.search);

            let presets = {
                domain: urlParams.get('domain'),
                endDate: urlParams.get('endDate'),
                opacity: urlParams.get('opacity'),
                pan: null,
                rasters: null,
                simId: urlParams.get('job_id'),
                startDate: urlParams.get('startDate'),
                timestamp: urlParams.get('timestamp'),
                zoom: urlParams.get('zoom'),
            }
            let pan = urlParams.get('pan');
            if (pan) {
                pan = pan.split(',').map(coord => Number(coord));
                presets.pan = pan;
            }
            let rasters = urlParams.get('rasters');
            if (rasters) {
                rasters = rasters.split(',');
                presets.rasters = rasters;
            }

            return presets;
        }

        createMap() {
            let center = [39.7392, -104.9903];
            let presetCenter = this.presetParameters.pan;
            if (presetCenter && presetCenter.length == 2) {
                center = presetCenter
            } else if (configData.organization.includes('SJSU')) {
                center = [37.34, -121.89];
            }
            let zoom = 7;
            let presetZoom = this.presetParameters.zoom;
            if (presetZoom && !isNaN(presetZoom)) {
                zoom = presetZoom;
            }
            let leafletMap = L.map('map-fd', {
                keyboard: false,
                layers: [this.baseLayerDict['OSM']],
                zoomControl: true,
                minZoom: 3,
                center: center,
                zoom: zoom
            });
            
            leafletMap.doubleClickZoom.disable();
            leafletMap.scrollWheelZoom.disable();
            
            // add scale & zoom controls to the map
            L.control.scale({ position: 'bottomright' }).addTo(leafletMap);
            
            leafletMap.on('zoomend', function() {
                // setURLParams();
            });

            leafletMap.on('moveend', function() {
                // setURLParams();
            });

            return leafletMap;
        }

        makeNoLevels() {
            const noLevels = new Set();
            const makeKey = (layerName, domain, timestamp) => {
              return layerName + ',' + domain + ',' + timestamp;
            }
            const addNoLevels = (layerName, domain, timestamp) => {
              let key = makeKey(layerName, domain, timestamp);
              noLevels.add(key);
            }
            const hasNoLevels = (layerName, domain, timestamp) => {
              let key = makeKey(layerName, domain, timestamp);
              return noLevels.has(key);
            }
      
            return ({
              add: addNoLevels,
              has: hasNoLevels,
              clear: () => noLevels.clear()
            });
        }

        constructor() {
            this.timestampSubscriptions = [];
            this.domainSubscriptions = [];
            this.simulationSubscriptions = [];
            this.simulationParameters = {
                simId: null,
                metaData: {},
                rasters: {},
                domains: [],
                sortedTimestamps: [],
                overlayOrder: [],
                noLevels: this.makeNoLevels(),
                domain: null,
                timestamp: null,
                startDate: null,
                endDate: null,
            };
            this.presetParameters = this.getPresets();
            this.overlayList = ['WINDVEC', 'WINDVEC1000FT', 'WINDVEC4000FT', 'WINDVEC6000FT', 'SMOKE1000FT', 'SMOKE4000FT', 'SMOKE6000FT', 'FIRE_AREA', 'SMOKE_INT', 'FGRNHFX', 'FLINEINT'],
            this.baseLayerDict = {
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
            }
            this.map = this.createMap();
        }

        subscribeComponent(component) {
            if (component.changeTimestamp) {
                this.timestampSubscriptions.push(component);
            }
            if (component.changeDomain) {
                this.domainSubscriptions.push(component);
            }
            this.simulationSubscriptions.push(component);
        }

        changeDomain(domId) {
            this.simulationParameters.domain = domId;

            for (let domainSub of this.domainSubscriptions) {
                domainSub.changeDomain(this.simulationParameters);
            }
        }

        changeTimestamp(timestamp) {
            this.simulationParameters.currentTimestamp = timestamp;

            for (let timestampSub of this.timestampSubscriptions) {
                timestampSub.changeTimestamp(this.simulationParameters);
            }
        }

        async changeSimulation(simulationMetaData) { 
            let { simId, description, path, manifestPath } = simulationMetaData;
            let simParams = this.simulationParameters;

            simParams.simId = simId;
            simParams.metaData = simulationMetaData;
            simParams.noLevels.clear();

            let simRasters = await getSimulationRasters(path);
            simParams.rasters = simRasters;
            simParams.domains = Object.keys(simRasters);
            let domain = this.presetDomain();
            simParams.sortedTimestamps = Object.keys(simRasters[domain]).sort();

            this.presetStartDate();
            this.presetEndDate();
            this.presetCurrentTimestamp();
            this.presetOpacity();
            this.presetOverlayOrder();

            for (let simulationSub of this.simulationSubscriptions) { 
                simulationSub.changeSimulation(this.simulationParameters);
            }

            // setURLParams();
        }

        presetDomain() {
            let domains = this.simulationParameters.domains;
            let presetDomain = this.presetParameters.domain;
            let domain = (domains.includes(presetDomain)) ? presetDomain : domains[0];

            this.presetParameters.domain = null;
            this.simulationParameters.domain = domain;
            return domain;
        }

        presetStartDate() {
            let simParams = this.simulationParameters;
            let sortedTimestamps = simParams.sortedTimestamps;
            let startDate = sortedTimestamps[0];
            let presetStartDate = localToUTC(this.presetParameters.startDate);
            let desc = simParams.metaData.description;
            if (sortedTimestamps.includes(presetStartDate)) {
                startDate = presetStartDate;
            } else if(desc.indexOf('GACC') >= 0 || desc.indexOf(' FM') >= 0 || desc.indexOf('SAT') >= 0) {
                let lastTimestamp = nextTimestamps[nextTimestamps.length - 1];
                for (let i = 2; i <= nextTimestamps.length; i++) {
                    startDate = nextTimestamps[nextTimestamps.length - i];
                    if (daysBetween(startDate, lastTimestamp) >= 15) {
                        startDate = nextTimestamps[nextTimestamps.length - i + 1];
                        break;
                    }
                }
            }
            this.presetParameters.startDate = null;
            this.simulationParameters.startDate = startDate;

            return startDate;
        }

        presetEndDate() {
            let sortedTimestamps = this.simulationParameters.sortedTimestamps;
            let endDate = sortedTimestamps[sortedTimestamps.length - 1];
            let presetEndDate = localToUTC(this.presetParameters.endDate);
            if (sortedTimestamps.includes(presetEndDate)) {
                endDate = presetEndDate;
            }
            this.presetParameters.endDate = null;
            this.simulationParameters.endDate = endDate;

            return endDate;
        }

        presetCurrentTimestamp() {
            let sortedTimestamps = this.simulationParameters.sortedTimestamps;
            let startDate = this.simulationParameters.startDate;
            let endDate = this.simulationParameters.endDate;
    
            let timestamp = startDate;
            let presetTimestamp = localToUTC(this.presetParameters.timestamp);
            if (sortedTimestamps.includes(presetTimestamp) && presetTimestamp >= startDate && presetTimestamp <= endDate) {
                timestamp = presetTimestamp;
            }
            this.presetParameters.timestamp = null;
            this.simulationParameters.timestamp = timestamp;

            return timestamp;
        }

        presetOpacity() {
            let opacity = 0.5;
            let presetOpacity = this.presetParameters.opacity;
            if (presetOpacity && !isNaN(presetOpacity)) {
                presetOpacity = Number(presetOpacity);
                if (presetOpacity >= 0 && presetOpacity <= 1) {
                    opacity = presetOpacity;
                }
            }
            this.presetParameters.opacity = null;
            this.simulationParameters.opacity = opacity;

            return opacity;
        }

        presetOverlayOrder() {
            let overlayOrder = [];
            let presetRasters = this.presetParameters.overlayOrder;
            if (presetRasters && presets.length > 0) {
                overlayOrder = presetRasters;
            }
            this.presetParameters.rasters = null;
            this.simulationParameters.overlayOrder = overlayOrder;

            return overlayOrder;
        }
    }

    return new SimState();
})();