const {LayerController} = require("../components/layerController");
const {L} = require("../leaflet/leaflet.js");
jest.mock("../leaflet/leaflet.js");
const {partial} = require("../partial1.js");


const controllers = require("../components/Controller.js");

const testDisplay = {};
jest.mock('../components/Controller.js', () => ({
    currentDomain: ({
        subscribe: () => {}
    }),
    current_display: ({
        getValue: () => testDisplay,
        setValue: jest.fn(),
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
                "2020": {T2: {raster: "raster test", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]}}, 
                       Overlay: {raster: "overlay test", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]} }}
            }
        })
    })
}));

describe('Setting up tests for layerController', () => {
    var layerController;

    beforeEach(async () => {
        layerController = await document.body.appendChild(new LayerController());
    });

    test('Layer Controller should poplute its raster and overlay layers correctly', () => {
        layerController.domainSwitch();
        const rasterLayers = layerController.rasterLayers;
        const overlayLayers = layerController.overlayLayers;
        // expect(Object.entries)
    });
});