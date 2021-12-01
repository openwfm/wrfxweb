import { InfoSection } from './infoSection.js';

class InfoPanel extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id='infoPanelContainer'>
                <button id='infoButton' class='feature-controller'>
                    <svg class='svgIcon interactive-button'>
                        <use href="#info_black_24dp"></use>
                    </svg>
                </button></div>
                <div id='infoPanel' class='feature-controller'>
                    <div id='closeInfoPanel' class='interactive-button close-panel'>x</div>
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
        closePanel.onclick = () => {
            infoPanel.classList.remove('clicked');
        }

        this.addSubsections(infoPanel);
    }

    addSubsections(infoPanel) {
        this.addCatalogMenuSection(infoPanel);
        this.addLayerControllerSection(infoPanel);
        this.addDomainSelectorSection(infoPanel);
        this.addSimulationControllerSection(infoPanel);
        this.addTimeSeriesSection(infoPanel);
        this.addURLSection(infoPanel);
    }

    async addCatalogMenuSection(infoPanel) {
        let header = 'Catalog Menu';
        let subsections = ['Sorting Catalog', 'Searching Catalog'];
        let catalogMenuSection = await new InfoSection(header, subsections);
        infoPanel.appendChild(catalogMenuSection);

        let generalDescription = `The <i>Catalog Menu</i> shows all available simulations that can 
                                  be shown on the current account.
                                  <br>
                                  To access the menu click the <b>Catalog</b> button in the 
                                  top left of the screen`;
        catalogMenuSection.updateDescription(header, generalDescription);

        let sortingDescription = `The <i>Catalog Menu</i> can be sorted by the following categories using the <b>sort by</b> dropdown menu: 
            <br>
            <br>
            <b>orignal order</b>: order simulations were added to the server EXCEPT FOR simulations in the <b>Fuel moisture</b> column, which in
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
            Order of any sorting can also be reversed using the <b>Reverse Order</b> checkbox
        `;
        catalogMenuSection.updateDescription(subsections[0], sortingDescription);

        let searchingDescription = `The <i>Catalog Menu</i> can be searched by the categories it is sorted by. For example, when <b>original order</b> 
                                    is selected, typing text in the search box will filter the results of every column based on if the description
                                    of each simulation matches the text in the search box. Typing text in the search box when <b>start date</b> is
                                    selected will filter based on whether start date matches the text. Search results can also be reversed. Search
                                    results are cleared when the sorting category is changed.`;
        catalogMenuSection.updateDescription(subsections[1], searchingDescription);
    }

    async addLayerControllerSection(infoPanel) {
        let header = 'Layer Controller';
        let subsections = ['Layer Selection', 'Switching Domains', 'Top Layer Opacity', 'Timeseries over all Markers'];
        let layerControllerSection = await new InfoSection(header, subsections);
        infoPanel.appendChild(layerControllerSection);

        let generalDescription = `The <i>Layer Controller</i> is found on the right hand side of the screen after a simulation has
                                  been selected from the <i>Catalog Menu</i> or can be accessed by clicking the <b>layer</b> button 
                                  at the top of the screen in mobile. It shows the different layers that can be shown in the 
                                  current simulation and domain.`;
        layerControllerSection.updateDescription(header, generalDescription);

        let layerSelection = `Selecting a layer from the <i>Layer Controller</i> adds it to the map and centers the map on the layer.
                              The layer may also show a colorbar that will appear on the left hand side of the screen. Adding a
                              layer will load the layer over the entire simulation (or a specified range of the simulation). The 
                              <i>Simulation Controller</i> shows the progress of loading the simulation. Multiple
                              layers can be added at once, with the most recently added layer considered the 'top' layer. Clicking
                              an added layer in the <i>Layer Controller</i> removes that layer. If the 'top' layer is removed, the most
                              recently added layer before that layer becomes the new 'top' layer. The colorbar shown is always the
                              most recently added layer that has a colorbar.`
        layerControllerSection.updateDescription(subsections[0], layerSelection);

        let switchDomains = `When switching domains, all the currently added layers will be preserved if those layers exist in the
                             new domain. If they do not, the layer will be removed and will have to be re added if needed when returning
                             to the original domain.`
        layerControllerSection.updateDescription(subsections[1], switchDomains);

        let opacityDescription = `The opacity of the top layer can be changed using the <b>Top Layer Opacity</b> slider bar. Opacity values
                                  range from 0 to 1 and change in increments of .05. To adjust the value the seeker can be clicked and dragged 
                                  to a new location, or the bar can be clicked directly to set the seeker to that location. Opacity is preserved
                                  when switching domains always applies to the top most layer. If the top most layer is removed, the opacity will
                                  apply to the new top most layer.`;
        layerControllerSection.updateDescription(subsections[2], opacityDescription);

        let timeSeriesDescription = `If there are any timeseries markers set, a timeseries can be created from the <i>Layer Controller</i> that draws 
                                     the data from all markers on the same chart. The date range is specified in the <b>start time</b> and
                                     <b>end time</b> dropdown menus. If the dates selected from these menus extends beyond the <b>start date</b>
                                     and <b>end date</b> of the simulation specified in the <i>Simulation Controller</i>, these values will be updated 
                                     and the corresponding data will be loaded.`;
        layerControllerSection.updateDescription(subsections[3], timeSeriesDescription);
    }

    async addTimeSeriesSection(infoPanel) {
        let header = 'Time Series Generation';
        let subsections = ['TimeSeries Markers', 'TimeSeries Chart', 'Data Type', 'Changing Domains'];
        let timeSeriesSection = await new InfoSection(header, subsections);
        infoPanel.appendChild(timeSeriesSection);

        let generalDescription = `If any added layers from the <i>Layer Controller</i> have an associated colorbar, a timeseries can be created to show
                                  the values of any point in the layer as defined by the colorbar. The timeseries will always be associated with the top
                                  most layer that has a colorbar.`;
        timeSeriesSection.updateDescription(header, generalDescription);

        let markerDesc = `Double clicking on a point in the top most layer with a colorbar will create a marker that shows some information about that point
                          including the latitude and longitude of the point on the map, the RGB values of the color at that point coded in that color, the 
                          location in the colorbar of the point, and some options to create a timeSeries over a range of time at this point. Changing the value 
                          of the current timestamp in the location using the <i>Simulation Controller</i> will also update the values in the marker accordingly 
                          to match the update to the layer. Clicking the <b>generate timeseries</b> button will load all timestamps between the specified range 
                          and retrieve the values in the colorbar at each time at the specified marker location and show a chart plotting these points. Selecting
                          <b>generate timeseries</b> from the marker will plot only the values at that marker's location. Multiple markers can be added to the layer
                          by double clicking at multiple locations and the timeseries associated with each marker can all be plotted with on the same chart by clicking
                          the <b>generate timeseries</b> button from the <b>Timeseries over all Markers</b> section of the <i>Layer Controller</i>.`;
        timeSeriesSection.updateDescription(subsections[0], markerDesc);

        let chartDesc = `After <b>generate timeseries</b> has been clicked, a chart will show in the center of the screen after all timestamps in the selected range
                         have been loaded and the values at the specified locations determined. When a timeseries is generated, the values at the corresponding locations
                         are cached for each timestamp so time spent reloading in the future is minimized. The generated chart can be clicked and dragged from the button in the top-left corner
                         to relocate the chart on the screen and the chart can be closed by clicking the <b>x</b> in the top-right corner. The color of the plotted line of values is determined by the color
                         of corresponding point on the layer at the time of generation. Clicking and dragging from top-left to bottom-right create a box that can be used 
                         to zoom into specific locations on the chart. A zoom range can also be specified using the <b>zoom in start</b> and <b>zoom in end</b> dropdown
                         menus. After zooming, the chart can be returned to its original range by clicking the back arrow at the top-left corner of the chart. Clicking on a
                         specific point in the plot will move the current timestamp of the simulation to the timestamp corresponding to the clicked data point. Using the 
                         <b>y-axis threshold</b> input box, a number value can be entered to draw a horizontal line on the chart at the value specified. All points above
                         this line will be highlighted, and all points below will be colored grey. This line can be given a label with the <b>threshold label</b> input.`;
        timeSeriesSection.updateDescription(subsections[1], chartDesc);

        let dataTypeDesc = `Changing the <b>data type</b> from the options used to create the timeseries Chart changes how the chart handles timestamps 
                            that do not have any data associated with them in the layer a timeseries is being generated for.
                            <br>
                            </br>
                            Selecting <b>continuous</b> from the dropdown will ensure that every timestamp in the specified range has a value associated with it
                            in the generated timeseries. If the layer has no value at a specified location and timestamp, then zero will be filled at that timestamp.
                            <br>
                            <br>
                            Selecting <b>discrete</b> from the dropdown will not enforce every timestamp in the specified range having a value associated with it. The
                            generated timeseries will instead directly connect only timestamps that have values at the specified location in the layer.`;
        timeSeriesSection.updateDescription(subsections[2], dataTypeDesc);

        let domainDesc = `Changing domains will clear all timeSeries Markers. Returning to a domain will not return the cleared timeSeries Markers.`;
        timeSeriesSection.updateDescription(subsections[3], domainDesc);
    }

    async addSimulationControllerSection(infoPanel) {
        let header = 'Simulation Controller';
        let subsections = ['Basic Navigation', 'Simulation Start and Stop Times', 'Loading Progress', 'Domain Switching'];
        let simulationControllerSection = await new InfoSection(header, subsections);
        infoPanel.appendChild(simulationControllerSection);

        let generalDescription = `The <i>Simulation Controller</i> is found in the bottom left of the screen after a simulation 
                                  has been selected from the <i>Catalog Menu</i>. It shows the current timestamp in the simulation
                                  as well as a bar showing the relative location of the current timestamp in full simulation. 
                                  The <i>Simulation Controller</i> is used to start and stop the simulation, navigate to a specific time, 
                                  and control whether the full simulation is loaded, or only subset of the simulation is loaded.`;
        simulationControllerSection.updateDescription(header, generalDescription);

        let navDesc = `Pressing Play will begin playing the simulation and advancing the timestamp. Pressing 
                       the outer double arrows toggle speeding up or slowing down the simulation.
                       From a paused position, clicking either of the inner arrows either advances
                       the simulation by a single timestamp or goes back to the previous timestamp. 
                       From the last timestamp of the simulation, advancing returns to the start, and 
                       from the first timestamp, going back goes to the last timestamp of the simulation.
                       Users can also click the bar below the navigation buttons to navigate to a relative
                       location in the simulation. Alternatively the seeker showing the relative location in 
                       the simulation can be clicked and dragged to a new location.`;
        simulationControllerSection.updateDescription(subsections[0], navDesc);

        let startStopDesc = `On the left and right ends of the navigation bar are two black bars that represent
                            start and stop times of the simulation. Selecting a layer from the <i>Layer Controller</i>
                            will load the layer over all timestamps included within the start and stop times specifid
                            with these two bars. Hovering over the bars will bring up a label specifying their exact 
                            times and clicking and dragging the bars will reset them to a new time. The start time is 
                            not permitted to exceed the end time and the current timestamp is not permitted to fall 
                            outside the range of the start and end times. If while moving either the start or end times,
                            the range is updated such that the current timestamp is outside of it, the current timestamp
                            will update with whichever of the start or end times are updating.`;
        simulationControllerSection.updateDescription(subsections[1], startStopDesc);

        let loadProgDesc = `After a layer from the <i>Layer Controller</i> is selected, all timestamps within the start and 
                            stop times will be loaded. The progress of loading will be shown on the navigation bar as a loading
                            bar starting at the start time and extending towards the end time. Once the loading bar has reached
                            the end time, all timestamps to play the simulation smoothly have been loaded. The simulation can still
                            be played while timestamps are still loading, but it may not be as smooth. The loading bar also only shows
                            the progress of the total times that need to be loaded and the location of the loading bar does not give 
                            information about which times have been loaded. When loading begins, it starts at the current timestamp and
                            loads the times between the current timestamp and the end time chromatically first before chromatically loading the times 
                            between the start time and the current timestamp. Layers that are loaded are cached so they do not need to 
                            be reloaded if they are removed and then re-added.`;
        simulationControllerSection.updateDescription(subsections[2], loadProgDesc);

        let domainDesc = `When switching domains, if the new domain has not been loaded before, loading will begin on the selected 
                          layers. The current timestamp, start time, and end time of the simulation are preserved when switching
                          domains UNLESS they do not exist in the new domain. If so than they will be updated to the nearest corresponding
                          timestamps in the new domain.`;
        simulationControllerSection.updateDescription(subsections[3], domainDesc);
    }

    async addDomainSelectorSection(infoPanel) {
        let header = 'Domain Selector';
        let subsections = [];
        let domainSelectorSection = await new InfoSection(header, subsections);
        infoPanel.appendChild(domainSelectorSection);

        let generalDescription = `The <i>Domain Selector</i> can be found underneath the <b>Catalog</b> button on desktop and by clicking
                                  the <b>domains</b> button at the top of the screen on mobile. Switching between domains can change the size
                                  and center of layers on the map as well as the granularity of the timestamps in the simulation (for example 
                                  going from hour increments in <i>domain 1</i> to 30 min increments in <i>domain 2</i>). Switching domains may
                                  also change which layers are available to add to the map from the <i>Layer Controller</i>.`;
        domainSelectorSection.updateDescription(header, generalDescription);
    }

    async addURLSection(infoPanel) {
        let header = 'URL Navigation';
        let subsections = [];
        let URLSection = await new InfoSection(header, subsections);
        infoPanel.appendChild(URLSection);

        let generalDescription = `As various settings such as timestamp, added layers, domain, etc are
                                  updated in the simulation they are saved as parameters in the URL.
                                  Clicking <b>Copy Link to Clipboard</b> copies this URL that can be used 
                                  to navigate to the simulation preset to the state it was in when the URL
                                  was copied. The URL can also be directly copied.`;
        URLSection.updateDescription(header, generalDescription);
    }
}

window.customElements.define('info-panel', InfoPanel);