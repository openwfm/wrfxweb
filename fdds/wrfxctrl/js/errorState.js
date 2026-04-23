export const errorState = (function makeErrorState() {
  class ErrorState {
    constructor() {
      this.subscribers = [];
      this.errorUIComponent = null;
      this.validationErrors = [];
    }

    setErrorComponent(component) {
      this.errorUIComponent = component;
    }

    subscribeComponent(component) {
      if (component.validateForIgnition) {
        this.subscribers.push(component);
      }
    }

    igniteSimulation() {
      if (this.validateComponents()) {
        this.buildJson();
        this.writeKmlFiles();
      } else {
        this.errorUIComponent.showErrors(this.validationErrors);
      }
    }

    buildJson() {
      let formData = {};
      for (let component of this.subscribers) {
        let componentFormData = component.jsonProps();
        formData = { ...formData, ...componentFormData };
      }
      return formData;
    }

    writeKmlFiles() { }

    validateComponents() {
      this.validationErrors = [];
      let ignitionPointsAdded = false;
      for (let subscriber of this.subscribers) {
        let componentError = subscriber.validateForIgnition();
        ignitionPointsAdded ||= subscriber.ignitionPointsAdded();
        if (componentError.messages.length > 0) {
          this.validationErrors.push(componentError);
        }
      }

      let componentsValid = this.validationErrors.length == 0;
      if (!componentsValid) {
        this.errorUIComponent.showErrors(this.validationErrors);
      }
      return componentsValid;
    }

    isProfileValid() {
      let profile = $("#profile").val();
      let errorMessages = [];
      if (profile == "") {
        let errorMessage = "Please select a job profile.";
        errorMessages.push(errorMessage);
      }
      return { header: "Simulation Profile", messages: errorMessages };
    }
  }
  return new ErrorState();
})();
