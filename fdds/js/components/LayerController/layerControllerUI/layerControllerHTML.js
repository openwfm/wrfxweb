export const layerControllerHTML = `
    <div id='layer-controller-mobile-wrapper'>
        <div id='layers-button' class='mobile-button feature-controller'>
            layers
        </div>
        <div id='layer-controller-container' class='feature-controller hidden'>
            <div id='base-maps'>
                <h4>Base Maps</h4>
                <div id='map-checkboxes' class='layer-list'>
                </div>
            </div>
            <div id='raster-layers' class='hidden'>
                <h4>Rasters</h4>
                <div id='raster-checkboxes' class='layer-list'>
                </div>
            </div>
            <div id='overlay-layers' class='hidden'>
                <h4>Overlays</h4>
                <div id='overlay-checkboxes' class='layer-list'>
                </div>
            </div>
            <div id='opacity-slider-container'>
                <h4>Top Layer Opacity</h4>
            </div>
        </div>
    </div>
`;
