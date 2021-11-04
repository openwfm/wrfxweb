export const simState = (function makeSimState() {
    class SimState {
        constructor() {
            this.timestampSubscriptions = [];
            this.domainSubscriptions = [];
            this.resetSubscriptions = [];
            this.currentDomain = null;
            this.currentTimestamp;
        }

        subscribeComponent(component) {
            if (component.changeTimestamp) {
                this.timestampSubscriptions.push(component);
            }
            if (component.changeDomain) {
                this.domainSubscriptions.push(component);
            }
            this.newSimSubscriptions.push(component);
        }

        updateDomain(domId) {
            this.currentDomain = domId;

            for (let domainSub of this.domainSubscriptions) {
                domainSub.changeDomain(domId);
            }
        }

        updateTimestamp(timestamp) {
            this.currentTimestamp = timestamp;

            for (let timestampSub of this.timestampSubscriptions) {
                timestampSub.changeTimestamp()
            }
        }
    }

    return new SimState();
})();