import { setURL } from "../util.js";

/** Class that enables data binding. Allows for callback functions to subscribe to the Controller which will
 * then be called whenever the value in the controller is updated. */
export class Controller {
    constructor(value=null) {
        this.listeners = [];
        this.value = value;
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    setValue(value) {
        this.value = value;
        this.notifyListeners();
    }

    getValue() {
        return this.value;
    }

    notifyListeners() {
        this.listeners.map(listener => listener());
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
    currentTimestamp: new Controller(),
    domainInstance: new Controller(),
    currentDomain: new Controller(),
    loadingProgress: new Controller(0),
    opacity: (function createOpacity() {
        var opacityController = new Controller(.5);

        opacityController.subscribe(() => {
            setURL();
        });

        return opacityController;
    })(),
    syncImageLoad: new SyncController(),
    startDate: (function createStartDate() {
        var startDateController = new Controller();

        const subscriptionFunction = () => {
            var newStartDate = startDateController.getValue();
            var currentTimestamp = controllers.currentTimestamp.getValue();

            if (newStartDate > currentTimestamp) {
                controllers.currentTimestamp.setValue(newStartDate);
            }

            setURL();
        }
        startDateController.subscribe(subscriptionFunction);

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

            setURL();
        }
        endDateController.subscribe(subscriptionFunction);

        return endDateController;
    })(),
};