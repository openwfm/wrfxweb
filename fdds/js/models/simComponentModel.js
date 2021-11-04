import { simState } from '../simState.js';

export class SimComponentModel {
    constructor() {
        simState.subscribeComponent(this);
    }
}