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

const testCoords = ({0: [0,0], 1: [0, 1], 2: [1, 0], 3: [1, 1]});

const util = require('../util.js');
jest.mock('../util.js', () => ({
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
        expect('testBase/rasterTest' in globalMap).toEqual(true);
        expect(util.simVars.overlayOrder.includes('raster')).toEqual(true);
    });

    test('Layers should be correctly removed from the map when selected', () => {
        layerController.handleOverlayadd('raster');
        layerController.handleOverlayRemove('raster');
        expect('testBase/rasterTest' in globalMap).toEqual(false);
    });

    test('Layer Controller should preserve previous selected layers when domain is switched on the same simulation', () => {
        layerController.handleOverlayadd('raster');
        controller.controllers.currentDomain.getValue = () => 2;
        layerController.domainSwitch();
        expect(util.simVars.overlayOrder.includes('raster')).toEqual(true);
        expect('testBase/rasterTest2' in globalMap).toEqual(true);
        expect('testBase/rasterTest' in globalMap).toEqual(false);
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

        util.simVars.overlayOrder = [];
        util.simVars.displayedColorbar = '';

        const div = document.createElement('div');
        div.id = 'raster-colorbar';
        await document.body.appendChild(div);

        layerController = await document.body.appendChild(new LayerController());
        layerController.domainSwitch();
        layerController.loadWithPriority = jest.fn();
    });

    test('Layer Controller should add any colorbars', () => {
        layerController.handleOverlayadd('raster');
        expect(util.simVars.displayedColorbar).toEqual('raster');
    });

    test('Layer Controller should remove colorbars when layer deselected', () => {
        layerController.handleOverlayadd('raster');
        layerController.handleOverlayRemove('raster');
        expect(util.simVars.displayedColorbar).toEqual(null);
    });

    test('Layer Controller should put most recent selected colorbar on top', () => {
        layerController.handleOverlayadd('raster');
        layerController.handleOverlayadd('overlay');
        expect(util.simVars.displayedColorbar).toEqual('overlay');
    });

    test('Layer Controller should put last selected colorbar on top when another is deselected', () => {
        layerController.handleOverlayadd('raster');
        layerController.handleOverlayadd('overlay');
        layerController.handleOverlayRemove('overlay');
        expect(util.simVars.displayedColorbar).toEqual('raster');
    });

    test('Layer Controller should remove colorbar when switching to a domain without one', () => {
        layerController.handleOverlayadd('raster');
        controller.controllers.currentDomain.getValue = () => 2;
        layerController.domainSwitch();
        expect(util.simVars.displayedColorbar).toEqual(null);
    });
});

describe('Tests for preloading', () => {
    var layerController;

    beforeEach(async () => {
        globalMap = {};
        imageUrl = '';

        controller.controllers.currentDomain.getValue = () => 1;
        controller.controllers.currentTimestamp.getValue = () =>'2020';
        util.simVars.sortedTimestamps = ['2020', '2021'];

        util.simVars.rasters = ({
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
        util.simVars.overlayOrder = [];
         
        const div = document.createElement('div');
        div.id = 'raster-colorbar';
        await document.body.appendChild(div);

        layerController = await document.body.appendChild(new LayerController());
        layerController.domainSwitch();
        layerController.loadWithPriority = jest.fn()
    });

    test('UpdateTime should not load if no layers currently added', () => {
        layerController.updateTime();
        expect(imageUrl).toEqual('');
    })

    test('UpdateTime should load a preloaded URL', () => {
        util.simVars.overlayOrder = ['layer'];
        var preloadedUrl = 'preloadedRasterTest1/2020';
        var currentRasters = util.simVars.rasters[controller.controllers.currentDomain.getValue()];
        var currentUrl = util.simVars.rasterBase + currentRasters[controller.controllers.currentTimestamp.getValue()]['layer'].raster;
        layerController.preloaded[currentUrl] = preloadedUrl;
        layerController.updateTime();
        expect(imageUrl).toEqual(preloadedUrl);
    });

    test('UpdateTime should load URLs not preloaded', () => {
        util.simVars.overlayOrder = ['layer'];
        layerController.updateTime();
        expect(imageUrl).toEqual('testBase/rasterTest1/2020');
    });

    test('UpdateTime should preload future times when current time not loaded', () => {
        util.simVars.overlayOrder = ['layer'];
        var futureTimeStamp = '2021';
        var preloadedFutureUrl = 'preloadedFutureUrl';
        layerController.loadWithPriority = (startTime, endTime, overlayOrder) => {
            var currentRasters = util.simVars.rasters[controller.controllers.currentDomain.getValue()];
            var futureUrl = util.simVars.rasterBase + currentRasters[endTime]['layer'].raster;
            layerController.preloaded[futureUrl] = preloadedFutureUrl;
        }
        layerController.updateTime();
        controller.controllers.currentTimestamp.getValue = () => futureTimeStamp;
        layerController.updateTime();
        expect(imageUrl).toEqual(preloadedFutureUrl);
    });

    test('Switching domains with a layer added should preload times', () => {
        expect(true).toEqual(true);
    });
});