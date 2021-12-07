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
            this.loadingProgressSubscriptions = [];
            this.timeSeriesStartSubscriptions = [];
            this.timeSeriesEndSubscriptions = [];
            this.dataTypeSubscriptions = [];
            this.timeSeriesController = null;
            this.nFrames = 0;
            this.framesLoaded = 0;
            this.timeSeriesParameters = {
                timeSeriesMarkers: [],
                noLevels: this.createNoLevels(),
                timeSeriesStart: '',
                timeSeriesEnd: '',
                timeSeriesDataType: 'continuous',
                timeSeriesProgress: 0,
                timeSeriesData: null,
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
        }

        generateTimeSeries() {
            this.timeSeriesController.generateTimeSeries();
        }

        cancelTimeSeries() {
            this.timeSeriesController.cancelTimeSeries();
        }

        setTimeSeriesData(timeSeriesData) {

        }

        setFrames(nFrames) {
            this.nFrames = nFrames;
            this.framesLoaded = 0;
            let progress = (this.Frames == 0) ? 0 : (this.loadedFrames / this.nFrames);
            this.changeLoadingProgress(progress);
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
    }

    return new TimeSeriesState();
})();
