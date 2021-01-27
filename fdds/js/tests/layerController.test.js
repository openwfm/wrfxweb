const {LayerController} = require("../components/layerController");
const {L} = require("../leaflet/leaflet.js");
jest.mock("../leaflet/leaflet.js");

const controllers = require("../components/Controller.js");

const testDisplay = {};
jest.mock('../components/Controller.js', () => ({
    currentDomain: ({
        subscribe: () => {}
    }),
    current_display: ({
        getValue: () => testDisplay,
        setValue: jest.fn()
    }),
    currentSimulation: ({
        getValue: () => "test",
    }),
    currentDomain: ({
        getValue: () => 1,
        subscribe: () => {}
    }),
    sorted_timestamps: ({
        getValue: () => ["2020"]
    }),
    raster_base: ({
        getValue: () => "test_base"
    }),
    rasters: ({
        getValue: () => ({
            1: {
                "2020": {"raster": {raster: "raster test", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]}}, 
                       "overlay": {raster: "overlay test", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]} }}
            }
        })
    }),
    organization: ({
        getValue: () => "SJSU"
    })
}));

const utils = require("../util.js");
jest.mock('../util.js', () => ({
    baseLayerDict: {},
    map: {
        addTo: jest.fn(),
        fitBounds: jest.fn()
    },
    dragElement: jest.fn(),
    overlay_list: ['overlay']
}));

describe('Setting up tests for layerController', () => {
    var layerController;

    beforeEach(async () => {
        layerController = await document.body.appendChild(new LayerController());
    });

    test('Layer Controller should populate its raster and overlay layers correctly', () => {
        layerController.domainSwitch();
        const rasterDict = layerController.rasterDict;
        const overlayDict = layerController.overlayDict;
        expect(Object.entries(rasterDict).length).toEqual(1);
        expect("raster" in rasterDict).toEqual(true);
        expect(Object.entries(overlayDict).length).toEqual(1);
        expect("overlay" in overlayDict).toEqual(true);
    });
});