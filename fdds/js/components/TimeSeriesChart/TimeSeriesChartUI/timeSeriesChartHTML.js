export const timeSeriesChartHTML = `
    <div id='fullContainer' class='hidden'>
        <div>
            <div id='addLayers' class='popout-layer-box'>
                <span class='interactive-button'>Added Layers</span>
            </div>
            <div id='layers-to-add' class='popout-layer-box hidden'></div>
        </div>
        <div id='timeSeriesChartContainer'>
            <div id='legendOptions' class='hidden'>
                <div class='interactive-button close-panel' id='closeLegendOptions'>x</div>
                <label class='legendItem' for'openMarker'>Open Marker Info</label>
                <input class='legendItem' type='checkbox' id='openMarker'/>
                <label class='legendItem' for='hideData'>Hide Data: </label>
                <input class='legendItem' type='checkbox' id='hideData'/>
                <label class='legendItem' for='timeseriesColorCode'>Change Color: </label>
                <input class='legendItem' type='color' id='timeseriesColorCode'></input>
                <label class='legendItem' for='addChangeName'>Add Name:</label>
                <input class='legendItem' id='addChangeName'></input>
            </div>
            <div id='zoomBox'></div>
            <div class='interactive-button close-panel' id='closeTimeSeriesChart'>x</div>
            <button id='drag-container' class='interactive-button'>
                <svg class='interactive-button' height=15 width=15>
                    <use href='#open_with_black_24dp'></use>
                </svg>
            </button>
            <button id='undo-zoom' class='interactive-button hidden'>
                <svg class='interactive-button' height=15 width=15>
                    <use href='#undo_black_24dp'></use>
                </svg>
            </button>
            <canvas id='timeSeriesChart' width='400px' height='400px'></canvas>
            <div id='break' class='section-break'></div>
            <div id='add-threshold'>
                <label class='legendItem' for='threshold-setter'>y-axis threshold: </label>
                <input class='legendInput' id='threshold-setter'></input>
                <label class='legendItem' for='threshold-label'>threshold label: </label>
                <input class='legendInput' id='threshold-label'></input>
            </div>
            <div id='zoomIn' style='display: inline-block; margin-top: 10px'>
                <label class='legendItem' for='zoom-start'>zoom in start: </label>
                <select class='legendSelect' id='zoom-start'></select>
                <label class='legendItem' for='zoom-end'>zoom in end: </label>
                <select class='legendSelect' id='zoom-end'></select>
            </div>
        </div>
    </div>
`;