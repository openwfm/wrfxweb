const { SimulationController } = require('../components/simulationController');

global.L = {DomEvent: {disableClickPropagation: jest.fn(), disableScrollPropagation: jest.fn()}};

const simVars = require('../simVars.js');
jest.mock('../simVars.js', () => ({
    simVars: ({
        sorted_timestamps: ['2020', '2021', '2022'],
        currentSimulation: 'currentSimulation',
    }), 
}));

const util = require('../util.js');
jest.mock('../util.js', () => ({
    utcToLocal: (timestamp) => timestamp,
    createElement: jest.fn()
}));

var currentTimestampSubscriptions = [];
var currentDomainSubscriptions = [];
const controller = require('../components/Controller.js');
jest.mock('../components/Controller.js', () => ({
    controllers: ({
        currentDomain: ({
            getValue: () => 1,
            subscribe: (fun) => currentDomainSubscriptions.push(fun)
        }),
        currentTimestamp: ({
            getValue: () => '2020',
            setValue: jest.fn(),
            subscribe: (fun) => currentTimestampSubscriptions.push(fun)
        }),
        startDate: ({
            getValue: () => '2020',
            subscribe: jest.fn()
        }),
        endDate: ({
            getValue: () => '2022',
            subscribe: jest.fn()
        }),
        loadingProgress: ({
            getValue: () => 0,
            subscribe: jest.fn()
        })
    }),
    controllerEvents: ({
        ALL: 'all'
    })
}));

describe('Simulation Controller Tests', () => {
    var simulationController;
    var currentTimestamp;

    beforeEach(async () => {
        currentTimestamp = '2020';

        simVars.simVars.currentSimulation = 'currentSimulation';
        simVars.simVars.sortedTimestamps = ['2020', '2021', '2022'];
        util.createElement = (id, className) => {
            const div = document.createElement('div');
            div.id = id;
            return div;
        }

        controller.controllers.currentDomain.getValue = () => 1;
        controller.controllers.currentTimestamp.getValue = () => currentTimestamp;
        controller.controllers.currentTimestamp.setValue = (newTimeStamp) => {
            currentTimestamp = newTimeStamp;
            for (var fun of currentTimestampSubscriptions) {
                fun();
            }
        }

        simulationController = await document.body.appendChild(new SimulationController());
        simulationController.currentFrame = 0;
    });
    
    test('Selecting nextFrame should advance frame', () => {
        // simulationController.updateSlider();
        simulationController.nextFrame();

        expect(controller.controllers.currentTimestamp.getValue()).toEqual('2021');
    });

    test('Selecting prevFrame should regress frame', () => {
        simulationController.nextFrame();
        simulationController.prevFrame();

        expect(controller.controllers.currentTimestamp.getValue()).toEqual('2020');
    });

    test('Switching domain should preserve relative current frame position', () => {
        for (var fun of currentDomainSubscriptions) {
            fun();
        }
        currentTimestamp = '2021';

        controller.controllers.currentDomain.getValue = () => 2;
        simVars.simVars.sortedTimestamps = ['2020', '2020.5', '2021', '2021.5', '2022'];
        for (var fun of currentDomainSubscriptions) {
            fun();
        }

        expect(controller.controllers.currentTimestamp.getValue()).toEqual('2021');
    });

    test('Switching from domain with more timestamps to less should preserve relative current frame position', () => {
        for (var fun of currentDomainSubscriptions) {
            fun();
        }
        currentTimestamp = '2021';
        controller.controllers.currentDomain.getValue = () => 2;
        simVars.simVars.sortedTimestamps = ['2020', '2020.5', '2021', '2021.5'];
        for (var fun of currentDomainSubscriptions) {
            fun();
        }
        controller.controllers.currentDomain.getValue = () => 1;
        simVars.simVars.sortedTimestamps = ['2020', '2021'];
        for (var fun of currentDomainSubscriptions) {
            fun();
        }

        expect(controller.controllers.currentTimestamp.getValue()).toEqual('2021');
    });
});