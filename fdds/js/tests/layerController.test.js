const { LayerController } = require('../components/layerController');

var globalMap = {};
var imageUrl = '';
global.L = { DomEvent: {disableClickPropagation: jest.fn(), disableScrollPropagation: jest.fn()},
            imageOverlay: (raster, coordinates, settings) => ({setUrl: (url, coords, options) => {globalMap[url] = coords; imageUrl = url;}, 
                                                               addTo: (map) => {globalMap[raster] = coordinates},
                                                               remove: (map) => {delete globalMap[raster]},
                                                               bringToFront: () => {},
                                                               bringToBack: () => {},
                                                               _image: {}}), 
            icon: (options) => {}};

const controller = require('../components/Controller.js');
jest.mock('../components/Controller.js', () => ({
    controllers: ({
        currentDomain: ({
            getValue: () => 1,
            subscribe: () => {}
        }),
        syncImageLoad: ({
            subscribe: (fun) => {},
            increment: () => {}
        }),
        currentTimestamp: ({
            getValue: () => '2020', 
            subscribe: (fun) => {}
        }),
    }),
    
}));

const util = require('../util.js');
jest.mock('../util.js', () => ({
    simVars: ({
        currentSimulation: 'test',
        rasters: ({
            1: {
                "2020": {"raster": {raster: "raster test", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]}, "colorbar": "test colorbar raster"}, 
                    "overlay": {raster: "overlay test", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]}, "colorbar": "test colorbar overlay" }},
                "2021": {"raster": {raster: "raster test current timestamp", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]}}, 
                    "overlay": {raster: "overlay test", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]} }}
            },
            2: {
                "2020": {"raster": {raster: "raster test 2", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]}}, 
                    "overlay": {raster: "overlay test 2", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]} }}
            }
        }),
        rasterBase: 'testBase/',
        sortedTimestamps: ['2020'],
        overlayOrder: [],
        displayedColorbar: null,
        organization: 'SJSU',
        overlayList: ['overlay'],
        baseLayerDict: {},
    }),
    map: {
        addTo: jest.fn(),
        fitBounds: jest.fn(),
        on: jest.fn()
    },
    dragElement: jest.fn(),
    debounce: jest.fn()
}));

HTMLCanvasElement.prototype.getContext = () => { 
    return {drawImage: jest.fn()}
};

describe('Tests for adding layers to menu and selecting layers', () => {
    var layerController;

    beforeEach(async () => {
        globalMap = {};
        controller.controllers.currentDomain.getValue = () => 1;
        controller.controllers.currentTimestamp.getValue = () =>'2020';
        util.simVars.overlayOrder = []
        const div = document.createElement('div');
        div.id = 'raster-colorbar';
        await document.body.appendChild(div);
        layerController = await document.body.appendChild(new LayerController());
        layerController.domainSwitch();
        layerController.loadWithPriority = jest.fn();
    });

    test('Layer Controller should populate its raster and overlay layers correctly', () => {
        const rasterDict = layerController.rasterDict;
        const overlayDict = layerController.overlayDict;
        expect(Object.entries(rasterDict).length).toEqual(1);
        expect('raster' in rasterDict).toEqual(true);
        expect(Object.entries(overlayDict).length).toEqual(1);
        expect('overlay' in overlayDict).toEqual(true);
    });

    test('Layers should be correctly added to the map when selected', () => {
        layerController.handleOverlayadd('raster');
        expect('testBase/raster test' in globalMap).toEqual(true);
        expect(util.simVars.overlayOrder.includes('raster')).toEqual(true);
    });

    test('Layers should be correctly removed from the map when selected', () => {
        layerController.handleOverlayadd('raster');
        layerController.handleOverlayRemove('raster');
        expect('testBase/raster test' in globalMap).toEqual(false);
    });

    test('Layer Controller should preserve previous selected layers when domain is switched on the same simulation', () => {
        layerController.handleOverlayadd('raster');
        controller.controllers.currentDomain.getValue = () => 2;
        layerController.domainSwitch();
        expect(util.simVars.overlayOrder.includes('raster')).toEqual(true);
        expect('testBase/raster test 2' in globalMap).toEqual(true);
        expect('testBase/raster test' in globalMap).toEqual(false);
    });

    test('Layer Controller should clear selected layers when domain is switched to new simulation', () => {
        layerController.handleOverlayadd('raster');
        util.simVars.currentSimulation = 'new simulation';
        layerController.domainSwitch();
        expect(util.simVars.overlayOrder.length).toEqual(0);
        expect(globalMap).toEqual({});
    });

    test('Layer Controller should show the current_timestamp', () => {
        controller.controllers.currentTimestamp.getValue = () => '2021';
        layerController.handleOverlayadd('raster');
        expect('testBase/raster test current timestamp' in globalMap).toEqual(true);
    });

    test('updateSlider should set img according to currentTimestamp', () => {
        controller.controllers.currentTimestamp.getValue = () => '2021';
        layerController.handleOverlayadd('raster');
        expect(imageUrl).toEqual('testBase/raster test current timestamp');
    });
});

// describe('Tests for adding layers with colorbars', () => {
//     var layerController;

//     beforeEach(async () => {
//         controllers.currentDomain.getValue = () => 1;
//         controllers.current_timestamp.getValue = () => "2020";
//         controllers.overlayOrder = [];
//         var colorbar = "";
//         controllers.displayedColorbar.getValue = () => colorbar;
//         controllers.displayedColorbar.setValue = (newColorbar) => {colorbar = newColorbar};
//         const div = document.createElement("div");
//         div.id = "raster-colorbar";
//         await document.body.appendChild(div);
//         layerController = await document.body.appendChild(new LayerController());
//         layerController.domainSwitch();
//     });

//     test('Layer Controller should add any colorbars', () => {
//         layerController.handleOverlayadd("raster");
//         expect(controllers.displayedColorbar.getValue()).toEqual("raster");
//     });

//     test('Layer Controller should remove colorbars when layer deselected', () => {
//         layerController.handleOverlayadd("raster");
//         layerController.handleOverlayRemove("raster");
//         expect(controllers.displayedColorbar.getValue()).toEqual(null);
//     });

//     test('Layer Controller should put most recent selected colorbar on top', () => {
//         layerController.handleOverlayadd("raster");
//         layerController.handleOverlayadd("overlay");
//         expect(controllers.displayedColorbar.getValue()).toEqual("overlay");
//     });

//     test('Layer Controller should put last selected colorbar on top when another is deselected', () => {
//         layerController.handleOverlayadd("raster");
//         layerController.handleOverlayadd("overlay");
//         layerController.handleOverlayRemove("overlay");
//         expect(controllers.displayedColorbar.getValue()).toEqual("raster");
//     });

//     test('Layer Controller should remove colorbar when switching to a domain without one', () => {
//         layerController.handleOverlayadd("raster");
//         controllers.currentDomain.getValue = () => 2;
//         layerController.domainSwitch();
//         expect(controllers.displayedColorbar.getValue()).toEqual(null);
//     });
// });