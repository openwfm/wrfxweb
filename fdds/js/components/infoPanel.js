import { InfoSection } from './infoSection.js';

class InfoPanel extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel='stylesheet' href='css/infoPanel.css'/>
            <div id='infoPanelContainer'>
                <button id='infoButton'>
                    <img src='icons/info_black_24dp.svg'></img>
                </button></div>
                <div id='infoPanel'>
                    <span id='closeInfoPanel'>x</span>
                    <h2>Feature List and Components</h2>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        const infoButton = this.querySelector('#infoButton');
        const infoPanel = this.querySelector('#infoPanel');
        const closePanel = this.querySelector('#closeInfoPanel');
        L.DomEvent.disableClickPropagation(infoButton);
        L.DomEvent.disableClickPropagation(infoPanel);

        infoButton.onclick = () => {
            if (infoPanel.classList.contains('clicked')) {
                infoPanel.classList.remove('clicked');
            } else {
                infoPanel.classList.add('clicked');
            }
        }
        infoButton.onmouseover = () => {
            infoPanel.classList.add('hovered');
        }
        infoButton.onmouseout = () => {
            infoPanel.classList.remove('hovered');
        }
        closePanel.onclick = () => {
            infoPanel.classList.remove('clicked');
        }

        this.addSubsections(infoPanel);
    }

    addSubsections(infoPanel) {
        this.addCatalogMenuSection(infoPanel);
        this.addLayerControllerSection(infoPanel);
        this.addTimeSeriesSection(infoPanel);
        this.addSimulationControllerSection(infoPanel);
        this.addDomainSelectorSection(infoPanel);
        this.addURLSection(infoPanel);
    }

    async addCatalogMenuSection(infoPanel) {
        var header = 'Catalog Menu';
        var subsections = ['Sorting Catalog', 'Searching Catalog'];
        var catalogMenuSection = await new InfoSection(header, subsections);
        infoPanel.appendChild(catalogMenuSection);

        var generalDescription = `The Catalog Menu shows all available simulations that can 
                                  be shown on the current account.
                                  <br>
                                  To access the menu click the Catalog button in the 
                                  top left of the screen`;
        catalogMenuSection.updateDescription(header, generalDescription);

        var sortingDescription = `The Catalog Menu can be sorted by the following categories using the <i>sort by</i> dropdown menu: 
            <br>
            <br>
            <b>orignal order</b>: order simulations were added to the server EXCEPT FOR simulations in the Fuel moisture column, which in
            <i>original order</i> sorting are sorted by description.
            <br>
            <br>
            <b>description</b>: sorted by alphabetical order of the simulation description (the text in bold of each simulation in the menu)
            <br>
            <br>
            <b>start date</b>: sorted by earliest start date (labeled <i>from</i>) to latest
            <br>
            <br>
            <b>end date</b>: sorted by earliest end date (labeled <i>to</i>) to latest
            <br>
            <br>
            Order of any sorting can also be reversed using the <i>Reverse Order</i> checkbox
        `;
        catalogMenuSection.updateDescription(subsections[0], sortingDescription);

        var searchingDescription = `The Catalog Menu can be searched by the categories it is sorted by. For example, when <i>original order</i> 
                                    is selected, typing text in the search box will filter the results of every column based on if the description
                                    of each simulation matches the text in the search box. Typing text in the search box when <i>start date</i> is
                                    selected will filter based on whether start date matches the text. Search results can also be reversed. Search
                                    results are cleared when the sorting category is changed.`;
        catalogMenuSection.updateDescription(subsections[1], searchingDescription);
                                  
    }

    async addLayerControllerSection(infoPanel) {
        var header = 'Layer Controller';
        var subsections = ['Layer Selection', 'Switching Domains', 'Top Layer Opacity'];
        var layerControllerSection = await new InfoSection(header, subsections);
        infoPanel.appendChild(layerControllerSection);

        var generalDescription = `The Layer Controler is found on the right hand side of the screen after a simulation has
                                  been selected from the Catalog Menu or can be accessed by clicking the 'layer' button 
                                  at the top of the screen in mobile. It shows the different layers that can be shown in the 
                                  current simulation and domain.`;
        layerControllerSection.updateDescription(header, generalDescription);

        var layerSelection = `Selecting a layer from the Layer Controller adds it to the map and centers the map on the layer.
                              The layer may also show a colorbar that will appear on the left hand side of the screen. Adding a
                              layer will load the layer over the entire simulation (or a specified range of the simulation). The 
                              Simulation Controller shows the progress of loading the simulation. Multiple
                              layers can be added at once, with the most recently added layer considered the 'top' layer. Clicking
                              an added layer in the Layer Controller removes that layer. If the 'top' layer is removed, the most
                              recently added layer before that layer becomes the new 'top' layer. The colorbar shown is always the
                              most recently added layer that has a colorbar.`
        layerControllerSection.updateDescription(subsections[0], layerSelection);

        var switchDomains = `When switching domains, all the currently added layers will be preserved if those layers exist in the
                             new domain. If they do not, the layer will be removed and will have to be re added if needed when returning
                             to the original domain.`
        layerControllerSection.updateDescription(subsections[1], switchDomains);
    }

    async addTimeSeriesSection(infoPanel) {
        var header = 'Time Series Generation';
        var subsections = ['TimeSeries Markers', 'TimeSeries Chart'];
        var timeSeriesSection = await new InfoSection(header, subsections);
        infoPanel.appendChild(timeSeriesSection);

    }

    async addSimulationControllerSection(infoPanel) {
        var header = 'Simulation Controller';
        var subsections = ['Basic Navigation', 'Simulation Start and Stop Times', 'Loading Progress'];
        var simulationControllerSection = await new InfoSection(header, subsections);
        infoPanel.appendChild(simulationControllerSection);

        var generalDescription = `The Simulation Controller is found in the bottom left of the screen after a simulation 
                                  has been selected from the Catalog Menu. It shows the current timestamp in the simulation
                                  as well as a bar showing the relative location of the current timestamp in full simulation. 
                                  The Simulation Controller is used to start and stop the simulation, navigate to a specific time, 
                                  and control whether the full simulation is loaded, or only subset of the simulation is loaded.`;
        simulationControllerSection.updateDescription(header, generalDescription);

        var navDesc = `Pressing Play will begin playing the simulation and advancing the timestamp. Pressing 
                       the outer double arrows toggle speeding up or slowing down the simulation.
                       From a paused position, clicking either of the inner arrows either advances
                       the simulation by a single timestamp or goes back to the previous timestamp. 
                       From the last timestamp of the simulation, advancing returns to the start, and 
                       from the first timestamp, going back goes to the last timestamp of the simulation.
                       Users can also click the bar below the navigation buttons to navigate to a relative
                       location in the simulation. Alternatively the seeker showing the relative location in 
                       the simulation can be clicked and dragged to a new location.`;
        simulationControllerSection.updateDescription(subsections[0], navDesc);
    }

    async addDomainSelectorSection(infoPanel) {
        var header = 'Domain Selector';
        var subsections = [];
        var domainSelectorSection = await new InfoSection(header, subsections);
        infoPanel.appendChild(domainSelectorSection);
    }

    async addURLSection(infoPanel) {
        var header = 'URL Navigation';
        var subsections = [];
        var URLSection = await new InfoSection(header, subsections);
        infoPanel.appendChild(URLSection);

        var generalDescription = `As various settings such as timestamp, added layers, domain, etc are
                                  updated in the simulation they are saved as parameters in the URL.
                                  Clicking 'Copy Link to Clipboard' copies this URL that can be used 
                                  to navigate to the simulation preset to the state it was in when the URL
                                  was copied. The URL can also be directly copied.`;
        URLSection.updateDescription(header, generalDescription);
    }
}

window.customElements.define('info-panel', InfoPanel);