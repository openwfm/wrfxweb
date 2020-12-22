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
const domainInstance = new Controller();
const currentDomain = new Controller();
const currentTimestamp = new Controller();