/** Class that enables data binding. Allows for callback functions to subscribe to the Controller which will
 * then be called whenever the value in the controller is updated.
 */
class Controller {
    constructor() {
        this.listeners = [];
        this.value = null;
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

// global variables
var currentSimulation = '';
var rasters = null;
var raster_base = null;
var sorted_timestamps = null;
var current_timestamp = null; // currently displayed timestamp
// Display context
var current_display = {}; // dictionary of layer name -> layer of currently displayed data
const domainInstance = new Controller();
const currentDomain = new Controller();
const currentTimestamp = new Controller();