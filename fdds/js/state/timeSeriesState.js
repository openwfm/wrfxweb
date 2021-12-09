import { getNewTimestamp } from '../util.js';

export const timeSeriesState = (function makeTimeSeriesState() {
    class TimeSeriesState {
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
            this.timeSeriesDataSubscriptions = [];
            this.loadingProgressSubscriptions = [];
            this.timeSeriesStartSubscriptions = [];
            this.timeSeriesEndSubscriptions = [];
            this.timeSeriesLayerSubscriptions = [];
            this.dataTypeSubscriptions = [];
            this.timeSeriesMarkersSubscriptions = [];
            this.markerUpdateSubscriptions = [];
            this.addMarkerSubscriptions = [];
            this.removeMarkerSubscriptions = [];
            this.timeSeriesController = null;
            this.nFrames = 0;
            this.framesLoaded = 0;
            this.timeSeriesParameters = {
                timeSeriesMarkers: [],
                noLevels: this.createNoLevels(),
                timeSeriesStart: '',
                timeSeriesEnd: '',
                timeSeriesDataType: 'continuous',
                loadingProgress: 0,
                timeSeriesData: null,
                timeSeriesLayer: '',
                showMarkers: true,
            };
        }

        subscribeComponent(component) {
            if (component.generateTimeSeries) {
                this.timeSeriesController = component;
            }
            if (component.changeTimeSeriesStart) {
                this.timeSeriesStartSubscriptions.push(component);
            }
            if (component.changeTimeSeriesEnd) {
                this.timeSeriesEndSubscriptions.push(component);
            }
            if (component.changeTimeSeriesProgress) {
                this.loadingProgressSubscriptions.push(component);
            }
            if (component.changeDataType) {
                this.dataTypeSubscriptions.push(component);
            }
            if (component.changeTimeSeriesMarkers) {
                this.timeSeriesMarkersSubscriptions.push(component);
            }
            if (component.addTimeSeriesMarker) {
                this.addMarkerSubscriptions.push(component);
            }
            if (component.removeTimeSeriesMarker) {
                this.removeMarkerSubscriptions.push(component);
            }
            if (component.changeTimeSeriesLayer) {
                this.timeSeriesLayerSubscriptions.push(component);
            }
            if (component.updateTimeSeriesMarker) {
                this.markerUpdateSubscriptions.push(component);
            }
            if (component.updateTimeSeriesData) {
                this.timeSeriesDataSubscriptions.push(component);
            }
        }

        changeSimulation({ startDate, endDate }) {
            this.timeSeriesParameters.timeSeriesStart = startDate;
            this.timeSeriesParameters.timeSeriesEnd = endDate;
            this.timeSeriesParameters.noLevels.clear();
            this.timeSeriesParameters.timeSeriesMarkers = [];
        }

        changeDomain(simulationParameters, prevTimestamps) {
            let { sortedTimestamps } = simulationParameters;
            let { timeSeriesStart, timeSeriesEnd } = this.timeSeriesParameters;
            let nextStartDate = getNewTimestamp(prevTimestamps, sortedTimestamps, timeSeriesStart);
            let nextEndDate = getNewTimestamp(prevTimestamps, sortedTimestamps, timeSeriesEnd);
            this.timeSeriesParameters.timeSeriesStart = nextStartDate;
            this.timeSeriesParameters.timeSeriesEnd = nextEndDate;
            this.timeSeriesParameters.timeSeriesMarkers = [];
        }

        generateTimeSeries() {
            this.timeSeriesController.generateTimeSeries();
        }

        cancelTimeSeries() {
            this.timeSeriesController.cancelTimeSeries();
            this.timeSeriesParameters.loadingProgress = 0;
        }

        setTimeSeriesData(timeSeriesData) {
            this.timeSeriesParameters.timeSeriesData = timeSeriesData;
            
            for (let timeSeriesDataSub of this.timeSeriesDataSubscriptions) {
                timeSeriesDataSub.updateTimeSeriesData(timeSeriesData);
            }
        }

        setFrames(nFrames) {
            this.nFrames = nFrames;
            this.framesLoaded = 0;
            this.changeLoadingProgress(0);
        }

        changeLoadingProgress(progress) {
            progress = Math.floor(progress*100) / 100;
            this.timeSeriesParameters.loadingProgress = progress;
            for (let progressSub of this.loadingProgressSubscriptions) {
                progressSub.changeTimeSeriesProgress(this.timeSeriesParameters);
            }
        }

        loadFrames(framesToLoad = 1) {
            this.framesLoaded = this.framesLoaded + framesToLoad;

            this.changeLoadingProgress(this.framesLoaded / this.nFrames);
        }

        changeTimeSeriesStart(timeSeriesStart) {
            this.timeSeriesParameters.timeSeriesStart = timeSeriesStart;

            for (let startSub of this.timeSeriesStartSubscriptions) {
                startSub.changeTimeSeriesStart(this.timeSeriesParameters);
            }
        }

        changeTimeSeriesEnd(timeSeriesEnd) {
            this.timeSeriesParameters.timeSeriesEnd = timeSeriesEnd

            for (let endSub of this.timeSeriesEndSubscriptions) {
                endSub.changeTimeSeriesEnd(this.timeSeriesParameters);
            }
        }

        changeTimeSeriesDataType(dataType) {
            this.timeSeriesParameters.timeSeriesDataType = dataType;

            for (let dataTypeSub of this.dataTypeSubscriptions) {
                dataTypeSub.changeTimeSeriesDataType(this.timeSeriesParameters);
            }
        }

        addTimeSeriesMarker(marker) {
            this.timeSeriesParameters.timeSeriesMarkers.push(marker);

            for (let timeSeriesMarkerSub of this.timeSeriesMarkersSubscriptions) {
                timeSeriesMarkerSub.changeTimeSeriesMarkers(this.timeSeriesParameters);
            }
            for (let addMarkerSub of this.addMarkerSubscriptions) {
                addMarkerSub.addTimeSeriesMarker(this.timeSeriesParameters);
            }
        }

        removeTimeSeriesMarker(marker) {
            let { timeSeriesMarkers } = this.timeSeriesParameters;
            let index = timeSeriesMarkers.indexOf(marker);
            timeSeriesMarkers.splice(index, 1);

            for (let timeSeriesMarkerSub of this.timeSeriesMarkersSubscriptions) {
                timeSeriesMarkerSub.changeTimeSeriesMarkers(this.timeSeriesParameters);
            }

            for (let removeMarkerSub of this.removeMarkerSubscriptions) {
                removeMarkerSub.removeTimeSeriesMarker(this.timeSeriesParameters, index);
            }
        }

        updateTimeSeriesMarker(marker) {
            let i = this.timeSeriesParameters.timeSeriesMarkers.indexOf(marker);
            for (let timeSeriesMarkerSub of this.markerUpdateSubscriptions) {
                timeSeriesMarkerSub.updateTimeSeriesMarker(this.timeSeriesParameters, i);
            }
        }

        changeTimeSeriesLayer(timeSeriesLayer) {
            this.timeSeriesParameters.timeSeriesLayer = timeSeriesLayer;

            for (let timeSeriesLayerSub of this.timeSeriesLayerSubscriptions) {
                timeSeriesLayerSub.changeTimeSeriesLayer(this.timeSeriesParameters);
            }
        }

        toggleShowMarkers() {
            this.timeSeriesParameters.showMarkers = !this.timeSeriesParameters.showMarkers;
        }
    }

    return new TimeSeriesState();
})();
