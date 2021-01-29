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
    current_display: ({
        getValue: () => ({"layer": {setUrl: jest.fn()}}),
        setValue: jest.fn()
    }),
    currentSimulation: ({
        getValue: () => "currentSimulation"
    }),
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

describe('Setting up tests for Simulation Controller', () => {
    var simulationController;
    var imgUrl;
    var current_timestamp;

    beforeEach(async () => {
        current_timestamp = "";
        imgUrl = "";
        controllers.currentSimulation.getValue = () => "currentSimulation";
        controllers.currentDomain.getValue = () => 1;
        controllers.sorted_timestamps.getValue = () => ["2020", "2021"];
        controllers.current_display.getValue = () => ({"layer": {setUrl: (newUrl, coordinates, org) => imgUrl = newUrl}}),
        controllers.current_timestamp.getValue = () => current_timestamp;
        controllers.current_timestamp.setValue = (newTimeStamp) => current_timestamp = newTimeStamp;
        simulationController = await document.body.appendChild(new SimulationController());
        simulationController.currentFrame = 0;
    });

    test('Images and their colorbars should preload', () => {
        simulationController.preloadVariables(0, 2);
        expect("layer" in simulationController.preloaded).toEqual(true);
        expect("layer_cb" in simulationController.preloaded).toEqual(true);
        expect(Object.keys(simulationController.preloaded["layer"]).length).toEqual(2);
        expect(Object.keys(simulationController.preloaded["layer_cb"]).length).toEqual(2);
    });

    test('Attempting to preload more images than exist should not crash', () => {
        simulationController.preloadVariables(0, 5);
        expect("layer" in simulationController.preloaded).toEqual(true);
        expect("layer_cb" in simulationController.preloaded).toEqual(true);
        expect(Object.keys(simulationController.preloaded["layer"]).length).toEqual(2);
        expect(Object.keys(simulationController.preloaded["layer_cb"]).length).toEqual(2);
    });

    test('SetUp For Time should change the current timestamp and preload images', () => {
        simulationController.setupForTime(0);
        expect("layer" in simulationController.preloaded).toEqual(true);
        expect("layer_cb" in simulationController.preloaded).toEqual(true);
        expect(Object.keys(simulationController.preloaded["layer"]).length).toEqual(2);
        expect(Object.keys(simulationController.preloaded["layer_cb"]).length).toEqual(2);
        expect(controllers.current_timestamp.getValue()).toEqual("2020");
        expect(imgUrl).toEqual("test_base/raster test 1: 2020");
    });

    test('updateSlider should set img and timestamp according to currentFrame', () => {
        simulationController.currentFrame = 1;
        simulationController.updateSlider();
        expect(controllers.current_timestamp.getValue()).toEqual("2021");
        expect(imgUrl).toEqual("test_base/raster test 1: 2021");
    });

    test('Selecting nextFrame should advance frame', () => {
        simulationController.updateSlider();
        simulationController.nextFrame(3);
        expect(controllers.current_timestamp.getValue()).toEqual("2021");
        expect(imgUrl).toEqual("test_base/raster test 1: 2021");
    });

    test('Selecting prevFrame should regress frame', () => {
        simulationController.currentFrame = 1;
        simulationController.updateSlider();
        simulationController.prevFrame(3);
        expect(controllers.current_timestamp.getValue()).toEqual("2020");
        expect(imgUrl).toEqual("test_base/raster test 1: 2020");
    });

    test('Switching domain should preserve relative current frame position', () => {
        simulationController.resetSlider();
        simulationController.currentFrame = 1;
        controllers.currentDomain.getValue = () => 2;
        controllers.sorted_timestamps.getValue = () => ["2020", "2020.5", "2021", "2021.5"];
        simulationController.resetSlider();
        expect(controllers.current_timestamp.getValue()).toEqual("2021");
        expect(imgUrl).toEqual("test_base/raster test 2: 2021");
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
        expect(imgUrl).toEqual("test_base/raster test 1: 2021");
    });

    test('Switching to a new simulation should reset the slider', () => {
        simulationController.resetSlider();
        simulationController.currentFrame = 1;
        simulationController.resetSlider();
        controllers.currentSimulation.getValue = () => "new Simulation";
        simulationController.resetSlider();
        expect(controllers.current_timestamp.getValue()).toEqual("2020");
        expect(imgUrl).toEqual("test_base/raster test 1: 2020");
    });
});