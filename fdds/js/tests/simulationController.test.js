const { SimulationController } = require('../components/simulationController');

global.L = {DomEvent: {disableClickPropagation: jest.fn(), disableScrollPropagation: jest.fn()}};

const util = require('../util.js');
jest.mock('../util.js', () => ({
    simVars: ({
        sorted_timestamps: ['2020', '2021'],
        currentSimulation: 'currentSimulation',
    }), 
    utcToLocal: (timestamp) => timestamp,
}));

const controller = require('../components/Controller.js');
jest.mock('../components/Controller.js', () => ({
    controllers: ({
        currentDomain: ({
            getValue: () => 1,
            subscribe: () => {}
        }),
        currentTimestamp: ({
            getValue: () => '2020',
            setValue: jest.fn()
        }),
    }),
}));

describe('Simulation Controller Tests', () => {
    var simulationController;
    var currentTimestamp;

    beforeEach(async () => {
        currentTimestamp = '';

        util.simVars.currentSimulation = 'currentSimulation';
        util.simVars.sortedTimestamps = ['2020', '2021'];

        controller.controllers.currentDomain.getValue = () => 1;
        controller.controllers.currentTimestamp.getValue = () => currentTimestamp;
        controller.controllers.currentTimestamp.setValue = (newTimeStamp) => currentTimestamp = newTimeStamp;

        simulationController = await document.body.appendChild(new SimulationController());
        simulationController.currentFrame = 0;
    });
    
    test('SetUp For Time should change the current timestamp', () => {
        simulationController.setupForTime(0);

        expect(controller.controllers.currentTimestamp.getValue()).toEqual('2020');
    });

    test('Selecting nextFrame should advance frame', () => {
        simulationController.updateSlider();
        simulationController.nextFrame(3);

        expect(controller.controllers.currentTimestamp.getValue()).toEqual('2021');
    });

    test('Selecting prevFrame should regress frame', () => {
        simulationController.currentFrame = 1;
        simulationController.updateSlider();
        simulationController.prevFrame(3);

        expect(controller.controllers.currentTimestamp.getValue()).toEqual('2020');
    });

    test('Switching domain should preserve relative current frame position', () => {
        simulationController.resetSlider();
        simulationController.currentFrame = 1;
        controller.controllers.currentDomain.getValue = () => 2;
        util.simVars.sortedTimestamps = ['2020', '2020.5', '2021', '2021.5'];
        simulationController.resetSlider();

        expect(controller.controllers.currentTimestamp.getValue()).toEqual('2021');
    });

    test('Switching from domain with more timestamps to less should preserve relative current frame position', () => {
        simulationController.resetSlider();
        simulationController.currentFrame = 3;
        simulationController.frameTotal = 4;
        controller.controllers.currentDomain.getValue = () => 2;
        util.simVars.sortedTimestamps = ['2020', '2020.5', '2021', '2021.5'];
        simulationController.resetSlider();
        controller.controllers.currentDomain.getValue = () => 1;
        util.simVars.sortedTimestamps = ['2020', '2021'];
        simulationController.resetSlider();

        expect(controller.controllers.currentTimestamp.getValue()).toEqual('2021');
    });

    test('Switching to a new simulation should reset the slider', () => {
        simulationController.resetSlider();
        simulationController.currentFrame = 1;
        simulationController.resetSlider();
        util.simVars.currentSimulation = 'new Simulation';
        simulationController.resetSlider();

        expect(controller.controllers.currentTimestamp.getValue()).toEqual('2020');
    });
});