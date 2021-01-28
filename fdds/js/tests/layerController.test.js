const {LayerController} = require("../components/layerController");

const globalMap = {};
global.L = {DomEvent: {disableClickPropagation: jest.fn(), disableScrollPropagation: jest.fn()},
            imageOverlay: (raster, coordinates, settings) => ({addTo: (map) => {globalMap[raster] = coordinates}, remove: (map) => {delete globalMap[raster]}, bringToFront: () => {}, bringToBack: () => {}})};

const controllers = require("../components/Controller.js");

var testDisplay = {};
jest.mock('../components/Controller.js', () => ({
    currentDomain: ({
        subscribe: () => {}
    }),
    current_display: ({
        getValue: () => ({}),
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
    current_timestamp: ({
        getValue: () => ["2020"]
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

describe('Tests for adding layers to menu and selecting layers', () => {
    var layerController;

    beforeEach(async () => {
        testDisplay = {};
        controllers.current_display.getValue = () => testDisplay;
        const div = document.createElement("div");
        div.id = "raster-colorbar";
        await document.body.appendChild(div);
        layerController = await document.body.appendChild(new LayerController());
        layerController.domainSwitch();
    });

    test('Layer Controller should populate its raster and overlay layers correctly', () => {
        const rasterDict = layerController.rasterDict;
        const overlayDict = layerController.overlayDict;
        expect(Object.entries(rasterDict).length).toEqual(1);
        expect("raster" in rasterDict).toEqual(true);
        expect(Object.entries(overlayDict).length).toEqual(1);
        expect("overlay" in overlayDict).toEqual(true);
    });

    test('Layers should be correctly added to the map when selected', () => {
        const rasterDict = layerController.rasterDict;
        layerController.handleOverlayadd("raster", rasterDict["raster"]);
        expect("test_baseraster test" in globalMap).toEqual(true);
        expect("raster" in controllers.current_display.getValue()).toEqual(true);
    });

    test('Layers should be correctly removed from the map when selected', () => {
        const rasterDict = layerController.rasterDict;
        layerController.handleOverlayadd("raster", rasterDict["raster"]);
        layerController.handleOverlayRemove("raster", rasterDict["raster"]);
        expect("raster" in globalMap).toEqual(false);
    });

    test('Layer Controller should preserve previous selected layers when domain is switched on the same simulation', () => {
        testDisplay = {"raster": { addTo: (map) => {}, 
                                   bringToFront: () => {}, 
                                   bringToBack: () => {},
                                   remove: (map) => {}
                                 }
                      };
        layerController.domainSwitch();
        expect("raster" in controllers.current_display.getValue()).toEqual(true);
    });
});