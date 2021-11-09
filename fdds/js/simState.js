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
                domain: null,
                timestamp: null,
                startDate: null,
                endDate: null,
            };
            this.presetParameters = this.getPresets();
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