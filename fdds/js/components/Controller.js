/** Class that enables data binding. Allows for callback functions to subscribe to the Controller which will
 * then be called whenever the value in the controller is updated.
 */
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

export class SyncController extends Controller {
    increment() {
        if (this.value == 0) this.value = 1;
        else this.setValue(0);
    }
}

// global variables
export const currentSimulation = new Controller();
export const rasters = new Controller();

export const raster_base = new Controller();

export const sorted_timestamps = new Controller();
export const current_timestamp = new Controller(); // currently displayed timestamp
// Display context
export const overlayOrder = []; // array of added layer names in order they were added name
export const displayedColorbar = new Controller();
export const domainInstance = new Controller();
export const currentDomain = new Controller();
export const organization = new Controller();

export const syncImageLoad = new SyncController(0);