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
        // this.listeners.push(callback);
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

/** Class to synchronise a function call at the end of two asynchronous events.
 * Useful for executing a function after both a layer and its colorbar have loaded. */
export class SyncController extends Controller {
    constructor() {
        super([false, false]);
    }

    increment(i) {
        this.value[i] = true;
        if (this.value[0] && this.value[1]) {
            this.setValue([false, false]);
        }
    }
}

// global controllers
export const controllers = {
    currentTimestamp: (function createCurrentTimestamp() {
        var currentTimestamp = new Controller();
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
            var progress = loadingProgress.loadedFrames / loadingProgress.nFrames;
            loadingProgress.setValue(progress);
        }

        return loadingProgress;
    })(),
    timeSeriesMarkers: (function createTimeSeriesMarkers() {
        var timeSeriesMarkers = new Controller([]);
        timeSeriesMarkers.removeEvent = 'REMOVE_EVENT';
        timeSeriesMarkers.add = (newMarker) => {
            timeSeriesMarkers.value.push(newMarker);
        }
        timeSeriesMarkers.remove = (removeMarker) => {
            var index = timeSeriesMarkers.value.indexOf(removeMarker);
            timeSeriesMarkers.value.splice(index, 1);
            timeSeriesMarkers.broadcastEvent(timeSeriesMarkers.removeEvent, index);
        }
        return timeSeriesMarkers;
    })(),
    opacity: new Controller(0.5),
    syncImageLoad: new SyncController(),
    startDate: (function createStartDate() {
        var startDateController = new Controller();

        const subscriptionFunction = () => {
            var newStartDate = startDateController.getValue();
            var currentTimestamp = controllers.currentTimestamp.getValue();

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
        var endDateController = new Controller();

        const subscriptionFunction = ()=> {
            var newEndDate = endDateController.getValue();
            var currentTimestamp = controllers.currentTimestamp.getValue();

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
};