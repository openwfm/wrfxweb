import { SimComponentModel } from './simComponentModel.js';

export class DomainDependentModel extends SimComponentModel {
    changeDomain(domId) {
        console.warn(`Changing domain to ${domId}. Implement changeDomain function for this component`);
    }
}