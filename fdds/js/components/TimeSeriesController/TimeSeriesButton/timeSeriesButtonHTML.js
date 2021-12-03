export const timeSeriesButtonHTML = `
    <div id='timeseries-button'>
        <div>
            <label class='timeseries-select-label' for='startDate'>start time:</label>
            <select class='timeseries-select' id='startDate'></select>
        </div>
        <div>
            <label class='timeseries-select-label' for='endDate'>end time: </label>
            <select class='timeseries-select' id='endDate'></select>
        </div>
        <div>
            <label class='timeseries-select-label' for='dataType'>data type: </label>
            <select class='timeseries-select' id='dataType'>
                <option value='continuous'>continuous</option>
                <option value='discrete'>discrete</option>
            </select>
        </div>
        <div>
            <label class='timeseries-select-label' for='layer-specification'>for layers: </label>
            <select class='timeseries-select' id='layer-specification'>
                <option value='all-added-layers'>all added layers</option>
                <option value='top-layer'>top layer</option>
            </select>
        </div>
        <button class='timeSeriesButton' id='timeSeriesButton'>
            <span id='generate-button-label'>generate timeseries</span>
            <span class='hidden' id='cancel-button-label'>cancel timeseries</span>
            <div id='progressBar' class='hidden'></div>
        </button>
    </div>
`;