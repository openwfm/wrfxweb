import { simVars } from '../simVars.js';
import { createTab, switchActiveSimulation } from '../util.js';
import { controllerEvents, controllers } from './Controller.js';

export class LayerTabs extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id='added-simulations'>
                <div class='tab' id='add-simulation'>
                    <div class='interactive-button innerTab'>+</div>
                </div>
            </div>
        `;

        this.activeTab = null;
        this.tabs = {};
        this.tabOrder = [];
    }

    makeNewTab(id) {
        const addedSimulations = this.querySelector('#added-simulations');
        const addSimulation = this.querySelector('#add-simulation');

        const newTab = createTab(id);

        this.tabs[id] = newTab;
        addedSimulations.insertBefore(newTab, addSimulation)
        this.switchActiveTab(id);
        newTab.onpointerdown = () => {
            // this.switchActiveTab(id);
            switchActiveSimulation(id);
        }
        newTab.ondblclick = () => {
            this.removeTab(id)
        }
    }

    removeTab(tabDescription) {
        if (this.tabOrder.length <= 1) {
            return;
        }

        const addedSimulations = this.querySelector('#added-simulations');
        let tab = this.tabs[tabDescription];
        let index = this.tabOrder.indexOf(tabDescription);

        this.tabOrder.splice(index, 1);
        if (this.activeTab == tab) {
            let newActive = this.tabOrder[0];
            // this.switchActiveTab(newActive);
            switchActiveSimulation(newActive);
        }
        delete this.tabs[tabDescription];

        controllers.addedSimulations.remove(tabDescription);
        addedSimulations.removeChild(tab);
    }

    connectedCallback() {
        const addSimulation = this.querySelector('#add-simulation');
        addSimulation.onclick = () => {
            controllers.addSimulation.setValue(true, controllerEvents.setTrue);
        }
        controllers.addedSimulations.subscribe((simName) => {
            this.makeNewTab(simName);
        }, controllers.addedSimulations.addEvent);
        const addedSimulations = this.querySelector('#added-simulations');
        controllers.addedSimulations.subscribe(() => {
            for (let tabDescription in this.tabs) {
                let tab = this.tabs[tabDescription];
                addedSimulations.removeChild(tab);
            }
            this.tabs = {};
            for (let simulation of controllers.addedSimulations.getValue()) {
                this.makeNewTab(simulation);
            }
        });
        controllers.currentDomain.subscribe(() => {
            this.switchActiveTab(simVars.currentDescription);
        }, controllerEvents.SIM_RESET);
    }

    switchActiveTab(activeDescription) {
        let newTab = this.tabs[activeDescription];
        if (this.activeTab == newTab) {
            return;
        }
        if (this.activeTab) {
            this.activeTab.classList.remove('active');
        }
        let index = this.tabOrder.indexOf(activeDescription);
        if (index >= 0) {
            this.tabOrder.splice(index, 1);
        }
        this.tabOrder.push(activeDescription);
        newTab.classList.add('active');
        this.activeTab = newTab;
    }

    show() {
        this.classList.remove('hidden');
    }

    hide() {
        this.classList.add('hidden');
    }

}

window.customElements.define('layer-tabs', LayerTabs);