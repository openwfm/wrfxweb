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

        createNoLevels() {
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
            this.loadingProgressSubscriptions = [];
            this.startDateSubscriptions = [];
            this.endDateSubscriptions = [];
            this.colorbarUrlSubscriptions = [];
            this.layerOpacitySubscriptions = [];
            this.nFrames = 0;
            this.framesLoaded = 0;
            this.simulationParameters = {
                simId: null,
                metaData: {},
                rasters: {},
                rasterBase: '',
                domains: [],
                sortedTimestamps: [],
                overlayOrder: [],
                noLevels: this.createNoLevels(),
                opacity: null,
                domain: 0.5,
                timestamp: null,
                colorbarURL: null,
                colorbarLayer: null,
                startDate: null,
                endDate: null,
                loadingProgress: 0,
                overlayList: ['WINDVEC', 'WINDVEC1000FT', 'WINDVEC4000FT', 'WINDVEC6000FT', 'SMOKE1000FT', 'SMOKE4000FT', 'SMOKE6000FT', 'FIRE_AREA', 'SMOKE_INT', 'FGRNHFX', 'FLINEINT'],
            };
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
            this.presetParameters = getPresetParams();
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
            if (component.changeColorbarURL) {
                this.colorbarUrlSubscriptions.push(component);
            }
            if (component.changeLayerOpacity) {
                this.layerOpacitySubscriptions.push(component);
            }

            this.simulationSubscriptions.push(component);
        }

        changeDomain(domId) {
            let { rasters, sortedTimestamps, timestamp, startDate, endDate } = this.simulationParameters;

            let nextTimestamps = Object.keys(rasters[domId]).sort();
            let nextTimestamp = this.getNewTimestamp(sortedTimestamps, nextTimestamps, timestamp);
            let nextStartDate = this.getNewTimestamp(sortedTimestamps, nextTimestamps, startDate);
            let nextEndDate = this.getNewTimestamp(sortedTimestamps, nextTimestamps, endDate);

            this.simulationParameters = {
                ...this.simulationParameters,
                domain: domId,
                sortedTimestamps: nextTimestamps,
                timestamp: nextTimestamp,
                startDate: nextStartDate,
                endDate: nextEndDate
            };

            for (let domainSub of this.domainSubscriptions) {
                domainSub.changeDomain(this.simulationParameters);
            }

            setURL(this.simulationParameters, this.map);
            this.setMapView();
        }

        getNewTimestamp(prevTimestamps, nextTimestamps, timestamp) {
            if (nextTimestamps.includes(timestamp)) {
                return timestamp;
            }
            let prevIndex = prevTimestamps.indexOf(timestamp);
            let percentage = prevIndex / prevTimestamps.length;
            let newIndex = Math.floor(nextTimestamps.length * percentage);
    
            return nextTimestamps[newIndex];
        }

        changeTimestamp(timestamp) {
            let { startDate, endDate } = this.simulationParameters;
            if ((timestamp > endDate) || (timestamp < startDate)) {
                return;
            }
            this.simulationParameters.timestamp = timestamp;

            for (let timestampSub of this.timestampSubscriptions) {
                timestampSub.changeTimestamp(this.simulationParameters);
            }
        }

        changeLayerOpacity(layerOpacity) {
            this.simulationParameters.opacity = layerOpacity;

            for (let opacitySub of this.layerOpacitySubscriptions) {
                opacitySub.changeLayerOpacity(this.simulationParameters);
            }
        }

        changeColorbarURL(colorbarURL) {
            this.simulationParameters.colorbarURL = colorbarURL;
            for (let colorbarSub of this.colorbarUrlSubscriptions) {
                colorbarSub.changeColorbarURL(this.simulationParameters);
            }
        }

        changeColorbarLayer(layerName) {
            this.simulationParameters.colorbarLayer = layerName;
        }
        
        setFrames(nFrames) {
            this.nFrames = nFrames;
            this.framesLoaded = 0;
            let progress = (this.Frames == 0) ? 0 : (this.loadedFrames / this.nFrames);
            this.changeLoadingProgress(progress);
        }

        changeLoadingProgress(progress) {
            progress = Math.floor(progress*100) / 100;
            this.simulationParameters.loadingProgress = progress;
            for (let progressSub of this.loadingProgressSubscriptions) {
                progressSub.changeLoadingProgress(this.simulationParameters);
            }
        }

        loadFrames(framesToLoad = 1) {
            this.framesLoaded = this.framesLoaded + framesToLoad;

            this.changeLoadingProgress(this.framesLoaded / this.nFrames);
        }

        changeStartDate(startDate) {
            let { endDate, timestamp } = this.simulationParameters;
            if (startDate >= endDate) {
                return;
            }
            if (startDate > timestamp) {
                this.changeTimestamp(startDate);
            }

            this.simulationParameters.startDate = startDate;

            for (let startDateSub of this.startDateSubscriptions) {
                startDateSub.changeStartDate(this.simulationParameters);
            }
        }

        changeEndDate(endDate) {
            let { startDate, timestamp } = this.simulationParameters;
            if (endDate <= startDate) {
                return;
            }
            if (endDate < timestamp) {
                this.changeTimestamp(endDate);
            }
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

            // simParams.rasterBase = path.substring(0, path.lastIndexOf('/') + 1);
            simParams.rasterBase = path.replaceAll(':', '_').substring(0, path.lastIndexOf('/') + 1);

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
            document.querySelector('#copyLink').classList.remove('hidden');
            document.querySelector('#simulation-flags').classList.remove('hidden');

            this.setMapView();

            for (let simulationSub of this.simulationSubscriptions) { 
                simulationSub.changeSimulation(this.simulationParameters);
            }


            setURL(this.simulationParameters, this.map);
            // NEED TO SET THE MAP VIEW HERE TOO
        }

        setMapView() {
            let { timestamp, domain, rasters } = this.simulationParameters;
            let firstRasters = rasters[domain][timestamp];
            let layerNames = Object.keys(firstRasters);
            let coords = firstRasters[layerNames[0]].coords;
            if (this.presetParameters.pan || this.presetParameters.zoom) {
                this.presetParameters.pan = null;
                this.presetParameters.zoom = null;
            } else { 
                this.map.fitBounds([ [coords[0][1], coords[0][0]], [coords[2][1], coords[2][0]] ]);
            }
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
                let lastTimestamp = sortedTimestamps[sortedTimestamps.length - 1];
                for (let i = 2; i <= sortedTimestamps.length; i++) {
                    startDate = sortedTimestamps[sortedTimestamps.length - i];
                    if (daysBetween(startDate, lastTimestamp) >= 15) {
                        startDate = sortedTimestamps[sortedTimestamps.length - i + 1];
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

export const map = simState.map;