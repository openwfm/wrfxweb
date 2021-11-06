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
                pan: urlParams.get('pan'),
                rasters: null,
                simId: urlParams.get('job_id'),
                startDate: urlParams.get('startDate'),
                timestamp: urlParams.get('timestamp'),
                zoom: urlParams.get('zoom'),
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
                this.presetParameters.startDate = null;
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
        }

        presetCurrentTimestamp() {
            let sortedTimestamps = this.simulationParameters.sortedTimestamps;
        }

        presetOpacity() {
            let sortedTimestamps = this.simulationParameters.sortedTimestamps;
        }

        presetOverlayOrder() {
            let sortedTimestamps = this.simulationParameters.sortedTimestamps;
        }
    }

    return new SimState();
})();