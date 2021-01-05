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

var currentSimulation = '';
var rasters = null;
var raster_base = null;
var sorted_timestamps = null;
var current_timestamp = null; // currently displayed timestamp
const domainInstance = new Controller();
const currentDomain = new Controller();
const currentTimestamp = new Controller();