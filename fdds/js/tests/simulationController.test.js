const {SimulationController} = require("../components/simulationController");

global.L = {DomEvent: {disableClickPropagation: jest.fn(), disableScrollPropagation: jest.fn()}};

const controllers = require("../components/Controller.js");
jest.mock('../components/Controller.js', () => ({
    currentDomain: ({
        getValue: () => 1,
        subscribe: () => {}
    }),
    sorted_timestamps: ({
        getValue: () => ["2020", "2021"]
    }),
    current_timestamp: ({
        getValue: () => "2020",
        setValue: jest.fn()
    }),
    currentSimulation: ({
        getValue: () => "currentSimulation"
    }),
    overlayOrder: ["layer"],
    rasters: ({
        getValue: () => ({
            1: {
                "2020": {"layer": {raster: "raster test 1: 2020", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]}, "colorbar": "colorbar 1: 2020"}},
                "2021": {"layer": {raster: "raster test 1: 2021", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]}, "colorbar": "colorbar 1: 2021"}}
            },
            2: {
                "2020": {"layer": {raster: "raster test 2: 2020", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]}, "colorbar": "colorbar 2: 2020"}},
                "2020.5": {"layer": {raster: "raster test 2: 2020.5", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]}, "colorbar": "colorbar 2: 2020.5"}},
                "2021": {"layer": {raster: "raster test 2: 2021", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]}, "colorbar": "colorbar 2: 2021"}},
                "2021.5": {"layer": {raster: "raster test 2: 2021.5", coords: {0: [0, 0], 1: [0, 1], 2: [1, 0], 3: [1, 1]}, "colorbar": "colorbar 2: 2021.5"}}
            }
        })
    }),
    raster_base: ({
        getValue: () => "test_base/"
    }),
    organization: ({
        getValue: () => "SJSU"
    })
}));

describe('Simulation Controller Tests', () => {
    var simulationController;
    var current_timestamp;

    beforeEach(async () => {
        current_timestamp = "";
        controllers.currentSimulation.getValue = () => "currentSimulation";
        controllers.currentDomain.getValue = () => 1;
        controllers.sorted_timestamps.getValue = () => ["2020", "2021"];
        controllers.current_timestamp.getValue = () => current_timestamp;
        controllers.current_timestamp.setValue = (newTimeStamp) => current_timestamp = newTimeStamp;
        simulationController = await document.body.appendChild(new SimulationController());
        simulationController.currentFrame = 0;
    });

    test('Images and their colorbars should preload', () => {
        simulationController.preloadVariables(0, 2);
        expect("layer" in simulationController.preloaded).toEqual(true);
        expect("layer_cb" in simulationController.preloaded).toEqual(true);
        expect(Object.keys(simulationController.preloaded["layer"][1]).length).toEqual(2);
        expect(Object.keys(simulationController.preloaded["layer_cb"]).length).toEqual(2);
    });

    test('Attempting to preload more images than exist should not crash', () => {
        simulationController.preloadVariables(0, 5);
        expect("layer" in simulationController.preloaded).toEqual(true);
        expect("layer_cb" in simulationController.preloaded).toEqual(true);
        expect(Object.keys(simulationController.preloaded["layer"][1]).length).toEqual(2);
        expect(Object.keys(simulationController.preloaded["layer_cb"]).length).toEqual(2);
    });
    
    test('SetUp For Time should change the current timestamp', () => {
        simulationController.setupForTime(0);
        expect(controllers.current_timestamp.getValue()).toEqual("2020");
    });

    test('Selecting nextFrame should advance frame', () => {
        simulationController.preloadVariables(0, 2);
        simulationController.updateSlider();
        simulationController.nextFrame(3);
        expect(controllers.current_timestamp.getValue()).toEqual("2021");
    });

    test('Selecting prevFrame should regress frame', () => {
        simulationController.preloadVariables(0, 2);
        simulationController.currentFrame = 1;
        simulationController.updateSlider();
        simulationController.prevFrame(3);
        expect(controllers.current_timestamp.getValue()).toEqual("2020");
    });

    test('Switching domain should preserve relative current frame position', () => {
        simulationController.resetSlider();
        simulationController.currentFrame = 1;
        controllers.currentDomain.getValue = () => 2;
        controllers.sorted_timestamps.getValue = () => ["2020", "2020.5", "2021", "2021.5"];
        simulationController.resetSlider();
        expect(controllers.current_timestamp.getValue()).toEqual("2021");
    });

    test('Switching from domain with more timestamps to less should preserve relative current frame position', () => {
        simulationController.resetSlider();
        simulationController.currentFrame = 3;
        simulationController.frameTotal = 4;
        controllers.currentDomain.getValue = () => 2;
        controllers.sorted_timestamps.getValue = () => ["2020", "2020.5", "2021", "2021.5"];
        simulationController.resetSlider();
        controllers.currentDomain.getValue = () => 1;
        controllers.sorted_timestamps.getValue = () => ["2020", "2021"];
        simulationController.resetSlider();
        expect(controllers.current_timestamp.getValue()).toEqual("2021");
    });

    test('Switching to a new simulation should reset the slider', () => {
        simulationController.resetSlider();
        simulationController.currentFrame = 1;
        simulationController.resetSlider();
        controllers.currentSimulation.getValue = () => "new Simulation";
        simulationController.resetSlider();
        expect(controllers.current_timestamp.getValue()).toEqual("2020");
    });
});