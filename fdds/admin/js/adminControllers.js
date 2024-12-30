import { debounceInIntervals } from "./adminUtils.js";

export const controllerEvents = {
  QUIET: "QUIET",
  VALUE_SET: "VALUE_SET",
  ALL: "ALL",
};

/** Class that enables data binding. Allows for callback functions to subscribe to the Controller which will
 * then be called whenever the value in the controller is updated. */
export class Controller {
  constructor(value = null) {
    this.listeners = {};
    this.value = value;
    this.debouncedSetValue = debounceInIntervals((setArgs) => {
      this.setValueCallback(setArgs);
    }, 100);
  }

  subscribe(callback, eventName = controllerEvents.VALUE_SET) {
    if (!(eventName in this.listeners)) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  setValue(value, eventName = controllerEvents.VALUE_SET) {
    this.setValueCallback([value, eventName]);
  }

  setValueCallback([value, eventName = controllerEvents.VALUE_SET]) {
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

  notifyListeners(listeners, args = null) {
    if (listeners == null) {
      return;
    }
    listeners.map((listener) => listener(args));
  }

  broadcastEvent(event, args = null) {
    this.notifyListeners(this.listeners[event], args);
  }
}

class ArrayController extends Controller {
  constructor(value = null) {
    super(value);
  }

  push(value) {
    this.setValue([...this.value, value]);
  }

  remove(value) {
    this.setValue(this.value.filter((element) => element !== value));
  }
}

// global controllers
export const adminControllers = {
  admins: new ArrayController([]),
  catalogs: new ArrayController([]),
};
