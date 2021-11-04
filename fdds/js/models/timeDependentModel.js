import { SimComponentModel } from './simComponentModel.js';

export class timeDependentModel extends SimComponentModel {
    changeTimestamp(timestamp) {
        console.warn(`Timestamp updating to ${timestamp}: Implement updateTimestamp function for this component.`);
    }
}