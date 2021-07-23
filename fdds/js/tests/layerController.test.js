const { LayerController } = require('../components/layerController');
const { SimulationLayer } = require('../components/simulationLayer');

var globalMap = {};
var imageUrl = '';
global.L = { DomEvent: {disableClickPropagation: jest.fn(), disableScrollPropagation: jest.fn()},
            imageOverlay: (raster, coordinates, settings) => ({setUrl: (url, coords=null, options) => {globalMap[url] = coords; imageUrl = url;}, 
                                                               addTo: (map) => {globalMap[raster] = coordinates},
                                                               remove: (map) => {delete globalMap[raster]},
                                                               setOpacity: (opacity) => {},
                                                               bringToFront: () => {},
                                                               bringToBack: () => {},
                                                               _image: {}}), 
            icon: (options) => {}};

const map = require('../map.js');
jest.mock('../map.js', () => ({
    map: {
        addTo: jest.fn(),
        fitBounds: jest.fn(),
        on: jest.fn()
    },
}));

const simVars = require('../simVars.js');
jest.mock('../simVars.js', () => ({
    simVars: ({
        currentSimulation: 'test',
        rasters: ({
            1: {
                '2020': {'raster': {raster: 'rasterTest', coords: testCoords, 'colorbar': 'testColorbar/raster'}, 
                    'overlay': {raster: 'overlayTest', coords: testCoords, 'colorbar': 'testColorbar/overlay' }},
                '2021': {'raster': {raster: 'rasterTest/currentTimestamp', coords: testCoords}, 
                    'overlay': {raster: 'overlayTest', coords: testCoords }}
            },
            2: {
                '2020': {'raster': {raster: 'rasterTest2', coords: testCoords }, 
                    'overlay': {raster: 'overlayTest2', coords: testCoords }}
            }
        }),
        rasterBase: 'testBase/',
        sortedTimestamps: ['2020'],
        overlayOrder: [],
        displayedColorbar: null,
        organization: 'SJSU',
        overlayList: ['overlay'],
        baseLayerDict: {},
        presets: {
            rasters: null
        }
    })
}));
   
var domainSubscriptions = [];
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
        opacity: ({
            getValue: () => 0.5,
            subscribe: (fun) => {} 
        }),
        startDate: ({
            getValue: () => '2020',
            subscribe: (fun) => {} 
        }),
        endDate: ({
            getValue: () => '2021',
            subscribe: (fun) => {} 
        })
    }),
    controllerEvents: ({
        simReset: 'simReset'
    })
    
}));

controller.controllers.currentDomain.subscribe = (fun, event='domainSwitch') => {
    if (domainSubscriptions[event] == null) {
        domainSubscriptions[event] = [];
    }
    domainSubscriptions[event].push(fun);
};



const testCoords = ({0: [0,0], 1: [0, 1], 2: [1, 0], 3: [1, 1]});

const util = require('../util.js');
jest.mock('../util.js', () => ({
    dragElement: jest.fn(),
    debounce: jest.fn(),
    setURL: jest.fn(),
}));

HTMLCanvasElement.prototype.getContext = () => { 
    return {drawImage: jest.fn()}
};

describe('Tests for adding layers to menu and selecting layers', () => {
    var layerController;

    beforeEach(async () => {
        globalMap = {};
        domainSubscriptions = {};
        controller.controllers.currentDomain.getValue = () => 1;
        controller.controllers.currentTimestamp.getValue = () =>'2020';

        simVars.simVars.overlayOrder = []
         
        const rasterColorbar = document.createElement('div');
        rasterColorbar.id = 'raster-colorbar';
        await document.body.appendChild(rasterColorbar);
        const copyLink = document.createElement('div');
        copyLink.id = 'copyLink';
        await document.body.appendChild(copyLink);

        layerController = await document.body.appendChild(new LayerController());
        layerController.domainSwitch();
        layerController.loadWithPriority = jest.fn();
    });

    test('Layer Controller should populate its raster and overlay layers correctly', () => {
        const rasterDict = layerController.rasterDict;
        const overlayDict = layerController.overlayDict;

        expect(Object.entries(rasterDict).length).toEqual(1);
        expect(1 in rasterDict).toEqual(true);
        expect('raster' in rasterDict[1]).toEqual(true);
        expect(Object.entries(overlayDict).length).toEqual(1);
        expect(1 in overlayDict).toEqual(true);
        expect('overlay' in overlayDict[1]).toEqual(true);
    });

    test('Layers should be correctly added to the map when selected', () => {
        layerController.handleOverlayadd('raster');

        expect('testBase/rasterTest' in globalMap).toEqual(true);
        expect(simVars.simVars.overlayOrder.includes('raster')).toEqual(true);
    });

    test('Layers should be correctly removed from the map when selected', () => {
        layerController.handleOverlayadd('raster');
        layerController.handleOverlayRemove('raster');

        expect('testBase/rasterTest' in globalMap).toEqual(false);
    });

    test('Layer Controller should preserve previous selected layers when domain is switched on the same simulation', () => {
        layerController.handleOverlayadd('raster');
        controller.controllers.currentDomain.getValue = () => 2;
        for (var subscription of domainSubscriptions['domainSwitch']) {
            subscription();
        }

        expect(simVars.simVars.overlayOrder.includes('raster')).toEqual(true);
        expect('testBase/rasterTest2' in globalMap).toEqual(true);
        expect('testBase/rasterTest' in globalMap).toEqual(false);
    });

    test('Layer Controller should clear selected layers when domain is switched to new simulation', () => {
        layerController.handleOverlayadd('raster');
        for (var subscription of domainSubscriptions['simReset']) {
            subscription();
        }

        expect(simVars.simVars.overlayOrder.length).toEqual(0);
        expect(globalMap).toEqual({});
    });

    test('Layer Controller should show the current_timestamp', () => {
        controller.controllers.currentTimestamp.getValue = () => '2021';
        layerController.handleOverlayadd('raster');

        expect('testBase/rasterTest/currentTimestamp' in globalMap).toEqual(true);
    });

    test('updateSlider should set img according to currentTimestamp', () => {
        controller.controllers.currentTimestamp.getValue = () => '2021';
        layerController.handleOverlayadd('raster');

        expect(imageUrl).toEqual('testBase/rasterTest/currentTimestamp');
    });
});

describe('Tests for adding layers with colorbars', () => {
    var layerController;

    beforeEach(async () => {
        controller.controllers.currentDomain.getValue = () => 1;
        controller.controllers.currentTimestamp.getValue = () => '2020';
        domainSubscriptions = {};

        simVars.simVars.overlayOrder = [];
        simVars.simVars.displayedColorbar = '';

        const rasterColorbar = document.createElement('div');
        rasterColorbar.id = 'raster-colorbar';
        await document.body.appendChild(rasterColorbar);
        const copyLink = document.createElement('div');
        copyLink.id = 'copyLink';
        await document.body.appendChild(copyLink);

        layerController = await document.body.appendChild(new LayerController());
        layerController.domainSwitch();
        layerController.loadWithPriority = jest.fn();
    });

    test('Layer Controller should add any colorbars', () => {
        layerController.handleOverlayadd('raster');

        expect(simVars.simVars.displayedColorbar).toEqual('raster');
    });

    test('Layer Controller should remove colorbars when layer deselected', () => {
        layerController.handleOverlayadd('raster');
        layerController.handleOverlayRemove('raster');

        expect(simVars.simVars.displayedColorbar).toEqual(null);
    });

    test('Layer Controller should put most recent selected colorbar on top', () => {
        layerController.handleOverlayadd('raster');
        layerController.handleOverlayadd('overlay');

        expect(simVars.simVars.displayedColorbar).toEqual('overlay');
    });

    test('Layer Controller should put last selected colorbar on top when another is deselected', () => {
        layerController.handleOverlayadd('raster');
        layerController.handleOverlayadd('overlay');
        layerController.handleOverlayRemove('overlay');

        expect(simVars.simVars.displayedColorbar).toEqual('raster');
    });

    test('Layer Controller should remove colorbar when switching to a domain without one', () => {
        layerController.handleOverlayadd('raster');
        controller.controllers.currentDomain.getValue = () => 2;
        for (var subscription of domainSubscriptions['domainSwitch']) {
            subscription();
        }

        expect(simVars.simVars.displayedColorbar).toEqual(null);
    });
});

describe('Tests for preloading', () => {
    var layerController;

    beforeEach(async () => {
        globalMap = {};
        imageUrl = '';
        domainSubscriptions = {};

        controller.controllers.currentDomain.getValue = () => 1;
        controller.controllers.currentTimestamp.getValue = () =>'2020';
        simVars.simVars.sortedTimestamps = ['2020', '2021'];

        simVars.simVars.rasters = ({
            1: {
                '2020': {'layer': {raster: 'rasterTest1/2020', coords: testCoords, 'colorbar': 'colorbar1/2020'}},
                '2021': {'layer': {raster: 'rasterTest1/2021', coords: testCoords, 'colorbar': 'colorbar1/2021'}}
            },
            2: {
                '2020': {'layer': {raster: 'rasterTest2/2020', coords: testCoords, 'colorbar': 'colorbar2/2020'}},
                '2020.5': {'layer': {raster: 'rasterTest2/2020.5', coords: testCoords, 'colorbar': 'colorbar2/2020.5'}},
                '2021': {'layer': {raster: 'rasterTest2/2021', coords: testCoords, 'colorbar': 'colorbar2/2021'}},
                '2021.5': {'layer': {raster: 'rasterTest2/2021.5', coords: testCoords, 'colorbar': 'colorbar2/2021.5'}}
            }
        })
        simVars.simVars.overlayOrder = [];
         
        const rasterColorbar = document.createElement('div');
        rasterColorbar.id = 'raster-colorbar';
        await document.body.appendChild(rasterColorbar);
        const copyLink = document.createElement('div');
        copyLink.id = 'copyLink';
        await document.body.appendChild(copyLink);

        layerController = await document.body.appendChild(new LayerController());
        layerController.domainSwitch();
        layerController.loadWithPriority = jest.fn()
    });

    test('UpdateTime should not load if no layers currently added', () => {
        layerController.updateTime();

        expect(imageUrl).toEqual('');
    });

    test('UpdateTime should load a preloaded URL', () => {
        simVars.simVars.overlayOrder = ['layer'];
        var currentDomain = controller.controllers.currentDomain.getValue();
        var activeLayer = 'layer';
        var currentTimestamp = controller.controllers.currentTimestamp.getValue();

        var preloadedUrl = 'preloadedRasterTest1/2020';
        var layer = layerController.getLayer(currentDomain, activeLayer);
        layer.preloadedRasters[currentTimestamp] = preloadedUrl;
        layerController.updateTime();

        expect(imageUrl).toEqual(preloadedUrl);
    });

    test('UpdateTime should load URLs not preloaded', () => {
        simVars.simVars.overlayOrder = ['layer'];
        layerController.updateTime();

        expect(imageUrl).toEqual('testBase/rasterTest1/2020');
    });

    test('UpdateTime should preload future times when current time not loaded', () => {
        var addedLayer = 'layer';
        simVars.simVars.overlayOrder = [addedLayer];

        var currentDomain = controller.controllers.currentDomain.getValue();
        var futureTimeStamp = '2021';
        var preloadedFutureUrl = 'preloadedFutureUrl';
        layerController.loadWithPriority = (startTime, endTime, overlayOrder) => {
            var layer = layerController.getLayer(currentDomain, addedLayer);
            layer.preloadedRasters[futureTimeStamp] = preloadedFutureUrl;
        }

        layerController.updateTime();
        controller.controllers.currentTimestamp.getValue = () => futureTimeStamp;
        layerController.updateTime();

        expect(imageUrl).toEqual(preloadedFutureUrl);
    });

    test('Switching domains with a layer added should preload times', () => {
        var addedLayer = 'layer';
        simVars.simVars.overlayOrder = [addedLayer];
        simVars.simVars.sortedTimestamps = ['2020', '2020.5', '2021', '2021.5'];
        controller.controllers.currentDomain.getValue = () => '2';
        controller.controllers.endDate.getValue = () => '2021.5';

        var futureTimeStamp = '2021.5';
        var preloadedFutureUrl = 'preloadedFutureUrl';
        layerController.loadWithPriority = (startTime, endTime, overlayOrder) => {
            var currentDomain = controller.controllers.currentDomain.getValue();
            var layer = layerController.getLayer(currentDomain, addedLayer);
            layer.preloadedRasters[futureTimeStamp] = preloadedFutureUrl;
        }
        
        controller.controllers.currentTimestamp.getValue = () => futureTimeStamp;
        for (var subscription of domainSubscriptions['domainSwitch']) {
            subscription();
        }

        expect(imageUrl).toEqual(preloadedFutureUrl);
    });
});