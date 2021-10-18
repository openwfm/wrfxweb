import { debounceInIntervals } from '../util.js';

export const controllerEvents = {
    QUIET: 'QUIET', 
    SIM_RESET: 'SIMULATION_RESET',
    VALUE_SET: 'VALUE_SET', 
    SLIDING_VALUE: 'SLIDING_VALUE',
    ALL: 'ALL'
}

/** Class that enables data binding. Allows for callback functions to subscribe to the Controller which will
 * then be called whenever the value in the controller is updated. */
export class Controller {
    constructor(value=null) {
        this.listeners = {};
        this.value = value;
        this.debouncedSetValue = debounceInIntervals((setArgs) => {
            this.setValueCallback(setArgs);
        }, 100);
    }

    subscribe(callback, eventName=controllerEvents.VALUE_SET) {
        if (!(eventName in this.listeners)) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    setValue(value, eventName=controllerEvents.VALUE_SET) {
        this.setValueCallback([value, eventName]);
    }

    setValueCallback([value, eventName=controllerEvents.VALUE_SET]) {
        this.value = value;
        if (eventName != controllerEvents.QUIET) {
            this.notifyListeners(this.listeners[eventName]);
            if (eventName != controllerEvents.ALL) {
                this.notifyListeners(this.listeners[controllerEvents.ALL]);
            }
        }
    }

    getValue() {
        return this.value;
    }

    notifyListeners(listeners, args=null) {
        if (listeners == null) {
            return;
        }
        listeners.map(listener => listener(args));
    }

    broadcastEvent(event, args=null) {
        this.notifyListeners(this.listeners[event], args);
    }
}

// global controllers
export const controllers = {
    currentTimestamp: (function createCurrentTimestamp() {
        let currentTimestamp = new Controller();
        currentTimestamp.setValue = (value, eventName=controllerEvents.VALUE_SET) => {
            currentTimestamp.debouncedSetValue([value, eventName]);
        }
        return currentTimestamp;
    })(),
    domainInstance: new Controller(),
    currentDomain: new Controller(),
    loadingProgress: (function createLoadProg() {
        const loadingProgress = new Controller(0);
        loadingProgress.nFrames = 0;
        loadingProgress.loadedFrames = 0;

        loadingProgress.setFrames = (nFrames) => {
            loadingProgress.nFrames = nFrames;
            loadingProgress.loadedFrames = 0;
            loadingProgress.setValue(0);
        }

        loadingProgress.frameLoaded = (frames = 1) => {
            loadingProgress.loadedFrames += frames;
            let progress = loadingProgress.loadedFrames / loadingProgress.nFrames;
            loadingProgress.setValue(progress);
        }

        return loadingProgress;
    })(),
    timeSeriesMarkers: (function createTimeSeriesMarkers() {
        let timeSeriesMarkers = new Controller([]);
        timeSeriesMarkers.removeEvent = 'REMOVE_EVENT';
        timeSeriesMarkers.add = (newMarker) => {
            timeSeriesMarkers.value.push(newMarker);
        }
        timeSeriesMarkers.remove = (removeMarker) => {
            let index = timeSeriesMarkers.value.indexOf(removeMarker);
            timeSeriesMarkers.value.splice(index, 1);
            timeSeriesMarkers.broadcastEvent(timeSeriesMarkers.removeEvent, index);
        }
        return timeSeriesMarkers;
    })(),
    opacity: new Controller(0.5),
    startDate: (function createStartDate() {
        let startDateController = new Controller();

        const subscriptionFunction = () => {
            let newStartDate = startDateController.getValue();
            let currentTimestamp = controllers.currentTimestamp.getValue();

            if (newStartDate > currentTimestamp) {
                controllers.currentTimestamp.setValue(newStartDate);
            }
        }
        startDateController.subscribe(subscriptionFunction, controllerEvents.ALL);
        startDateController.setValue = (value, eventName=controllerEvents.VALUE_SET) => {
            startDateController.debouncedSetValue([value, eventName]);
        }

        return startDateController;
    })(),
    endDate: (function createEndDate() {
        let endDateController = new Controller();

        const subscriptionFunction = ()=> {
            let newEndDate = endDateController.getValue();
            let currentTimestamp = controllers.currentTimestamp.getValue();

            if (newEndDate < currentTimestamp) {
                controllers.currentTimestamp.setValue(newEndDate);
            }
        }
        endDateController.subscribe(subscriptionFunction, controllerEvents.ALL);
        endDateController.setValue = (value, eventName=controllerEvents.VALUE_SET) => {
            endDateController.debouncedSetValue([value, eventName]);
        }

        return endDateController;
    })(),
    colorbarURL: new Controller(''),
};