import { getSimulation } from "./services";

export const simState = (function makeSimState() {
    class SimState {
        getPresets() {
            const urlParams = new URLSearchParams(window.location.search);

            let presets = {
                presetZoom: urlParams.get('zoom'),
                presetPan: urlParams.get('pan'),
                presetSimId: urlParams.get('job_id'),
                presetDomain: urlParams.get('domain'),
                presetTimestamp: urlParams.get('timestamp'),
                presetRasters: null,
                presetStartDate: urlParams.get('startDate'),
                presetEndDate: urlParams.get('endDate'),
                presetOpacity: urlParams.get('opacity'),
            }
            return presets;
        }

        constructor() {
            this.timestampSubscriptions = [];
            this.domainSubscriptions = [];
            this.simulationSubscriptions = [];
            this.simulationParameters = {
                currentSimulationId: null,
                currentTimestamp: null,
                currentDomain: null,
                rasters: [],
                overlayOrder: [],
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
            this.simulationParameters.currentDomain = domId;

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

        changeSimulation(simulationMetaData) { 
            let { simId, description, path, manifestPath } = simulationMetaData;
            this.currentSimulationId = simId;
            this.simulationParameters.simulationMetaData = simulationMetaData;

            await getSimulation(path);

            for (let simulationSub of this.simulationSubscriptions) { 
                simulationSub.changeSimulation(this.simulationParameters);
            }
        }
    }

    return new SimState();
})();