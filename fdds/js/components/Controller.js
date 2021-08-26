import { debounceInIntervals } from '../util.js';

export const controllerEvents = {
    quiet: 'QUIET', 
    simReset: 'SIMULATION_RESET',
    valueSet: 'VALUE_SET', 
    slidingValue: 'SLIDING_VALUE',
    all: 'ALL',
    setTrue: 'SET_TRUE',
    setFalse: 'SET_FALSE'
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

    subscribe(callback, eventName=controllerEvents.valueSet) {
        // this.listeners.push(callback);
        if (!(eventName in this.listeners)) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    setValue(value, eventName=controllerEvents.valueSet) {
        this.setValueCallback([value, eventName]);
    }

    setValueCallback([value, eventName=controllerEvents.valueSet]) {
        this.value = value;
        if (eventName != controllerEvents.quiet) {
            this.notifyListeners(this.listeners[eventName]);
            if (eventName != controllerEvents.all) {
                this.notifyListeners(this.listeners[controllerEvents.all]);
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

function makeArrayController() {
    var arrayController = new Controller([]);
    arrayController.removeEvent = 'REMOVE_EVENT';
    arrayController.addEvent = 'ADD_EVENT';
    arrayController.add = (newMarker) => {
        arrayController.value.push(newMarker);
        arrayController.broadcastEvent(arrayController.addEvent, newMarker);
    }
    arrayController.remove = (removeMarker) => {
        var index = arrayController.value.indexOf(removeMarker);
        arrayController.value.splice(index, 1);
        arrayController.broadcastEvent(arrayController.removeEvent, index);
    }
    return arrayController;
}

// global controllers
export const controllers = {
    currentTimestamp: (function createCurrentTimestamp() {
        var currentTimestamp = new Controller();
        currentTimestamp.setValue = (value, eventName=controllerEvents.valueSet) => {
            currentTimestamp.debouncedSetValue([value, eventName]);
        }
        return currentTimestamp;
    })(),
    domainInstance: new Controller(),
    currentDomain: new Controller(),
    addSimulation: new Controller(false),
    addedSimulations: makeArrayController(),
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
    timeSeriesMarkers: makeArrayController(),
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
        startDateController.subscribe(subscriptionFunction, controllerEvents.all);
        startDateController.setValue = (value, eventName=controllerEvents.valueSet) => {
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
        endDateController.subscribe(subscriptionFunction, controllerEvents.all);
        endDateController.setValue = (value, eventName=controllerEvents.valueSet) => {
            endDateController.debouncedSetValue([value, eventName]);
        }

        return endDateController;
    })(),
};