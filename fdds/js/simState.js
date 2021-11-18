import { getSimulationRasters } from './services.js';
import { localToUTC, daysBetween } from './util.js';
import { getPresetParams, setURL } from './urlUtils.js';
import { configData } from './app.js';

export const simState = (function makeSimState() {
    class SimState {
        createMap({ presetCenter, presetZoom, mapLayer }) {
            let center = [39.7392, -104.9903];
            if (presetCenter && presetCenter.length == 2) {
                center = presetCenter
            } else if (configData.organization.includes('SJSU')) {
                center = [37.34, -121.89];
            }
            let zoom = 7;
            if (presetZoom && !isNaN(presetZoom)) {
                zoom = presetZoom;
            }
            let leafletMap = L.map('map-fd', {
                keyboard: false,
                layers: [mapLayer],
                zoomControl: true,
                minZoom: 3,
                center: center,
                zoom: zoom
            });
            
            leafletMap.doubleClickZoom.disable();
            leafletMap.scrollWheelZoom.disable();
            
            // add scale & zoom controls to the map
            L.control.scale({ position: 'bottomright' }).addTo(leafletMap);
            
            leafletMap.on('zoomend', () => {
                setURL(this.simulationParameters, leafletMap);
            });

            leafletMap.on('moveend', () => {
                setURL(this.simulationParameters, leafletMap);
            });

            return leafletMap;
        }

        constructor() {
            this.timestampSubscriptions = [];
            this.domainSubscriptions = [];
            this.simulationSubscriptions = [];
            this.loadingProgressSubscriptions = [];
            this.startDateSubscriptions = [];
            this.endDateSubscriptions = [];
            this.simulationParameters = {
                simId: null,
                metaData: {},
                rasters: {},
                domains: [],
                sortedTimestamps: [],
                overlayOrder: [],
                opacity: null,
                domain: 0.5,
                timestamp: null,
                startDate: null,
                endDate: null,
                loadingProgress: 0,
            };
            this.presetParameters = getPresetParams();
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
            let mapParams = {
                presetCenter: this.presetParameters.pan,
                presetZoom: this.presetParameters.zoom,
                mapLayer: this.baseLayerDict['OSM'],
            }
            this.map = this.createMap(mapParams);
        }

        subscribeComponent(component) {
            if (component.changeTimestamp) {
                this.timestampSubscriptions.push(component);
            }
            if (component.changeDomain) {
                this.domainSubscriptions.push(component);
            }
            if (component.changeLoadingProgress) {
                this.loadingProgressSubscriptions.push(component);
            }
            if (component.changeStartDate) {
                this.startDateSubscriptions.push(component);
            }
            if (component.changeEndDate) {
                this.endDateSubscriptions.push(component);
            }
            this.simulationSubscriptions.push(component);
        }

        changeDomain(domId) {
            this.simulationParameters.domain = domId;

            for (let domainSub of this.domainSubscriptions) {
                domainSub.changeDomain(this.simulationParameters);
            }

            setURL(this.simulationParameters , this.map)
        }

        changeTimestamp(timestamp) {
            this.simulationParameters.timestamp = timestamp;

            for (let timestampSub of this.timestampSubscriptions) {
                timestampSub.changeTimestamp(this.simulationParameters);
            }
        }

        loadFrame() {
            let progress = 0;
            this.simulationParameters.loadingProgress = progress;

            for (let loadingProgressSub of this.loadingProgressSubscriptions) {
                loadingProgressSub.changeLoadingProgress(this.simulationParameters);
            }
        }

        changeStartDate(startDate) {
            this.simulationParameters.startDate = startDate;

            for (let startDateSub of this.startDateSubscriptions) {
                startDateSub.changeStartDate(this.simulationParameters);
            }
        }

        changeEndDate(endDate) {
            this.simulationParameters.endDate = endDate;

            for (let endDateSub of this.endDateSubscriptions) {
                endDateSub.changeEndDate(this.simulationParameters);
            }
        }

        async changeSimulation(simulationMetaData) { 
            let { simId, description, path, manifestPath } = simulationMetaData;
            let simParams = this.simulationParameters;

            simParams.simId = simId;
            simParams.metaData = simulationMetaData;

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

            document.querySelector('#current-sim-label').innerText = 'Shown simulation: ' + description;

            document.querySelector('#simulation-flags').classList.remove('hidden');

            for (let simulationSub of this.simulationSubscriptions) { 
                simulationSub.changeSimulation(this.simulationParameters);
            }


            setURL(this.simulationParameters, this.map);
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