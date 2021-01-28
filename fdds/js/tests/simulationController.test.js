const {SimulationController} = require("../components/simulationController");

global.L = {DomEvent: {disableClickPropagation: jest.fn(), disableScrollPropagation: jest.fn()}};

const controllers = require("../components/Controller.js");
jest.mock('../components/Controller.js', () => ({
    currentDomain: ({
        getValue: () => 1,
        subscribe: () => {}
    }),
    sorted_timestamps: ({
        getValue: () => ["2020"]
    }),
    current_timestamp: ({
        getValue: () => "2020",
        setValue: jest.fn()
    }),
    current_display: ({
        getValue: () => ({}),
        setValue: jest.fn()
    }),
    currentSimulation: ({
        getValue: () => "currentSimulation"
    }),
    rasters: ({
        getValue: () => ({})
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

    beforeEach(async () => {
        simulationController = await document.body.appendChild(new SimulationController());
    });

    test('first simulationController test', () => {
        
    });
});