const { DomainSelector } = require('../components/domainSelector');

global.L = { DomEvent: {disableClickPropagation: jest.fn()}};
const simVars = require('../simVars.js');
jest.mock('../simVars.js', () => ({
    simVars: ({
        sortedTimestamps: [],
        rasters: ({
            1: {
                '2020': {'raster': {}}
            },
            2: {
                '2020': {'raster': {}},
                '2021': {'raster': {}}
            },
            3: {
                '2020': {'raster': {}},
                '2020.5': {'raster':{}},
                '2021': {'raster': {}},
                '2021.5': {'raster': {}},
                '2022' : {'raster': {}}
            }
        }),
        presets: ({ 
            opacity: "0.5"
        }),
        currentDescription: '',
    }),
}));

const util = require('../util.js');
jest.mock('../util.js', () => ({
    localToUTC: jest.fn()
}));

const controller = require('../components/Controller.js');
jest.mock('../components/Controller.js', () => ({
    controllers: ({
        domainInstance: ({
            subscribe: jest.fn(),
            getValue: () => [1, 2]
        }),
        currentTimestamp: ({
            getValue: () => '2020',
            setValue: jest.fn()
        }),
        currentDomain: ({
            getValue: jest.fn(),
            setValue: jest.fn()
        }),
        startDate: ({
            getValue: () => '2020',
            setValue: jest.fn()
        }),
        endDate: ({
            getValue: () => '2021',
            setValue: jest.fn()
        }),
        opacity: ({
            getValue: () => 0.5,
            setValue: jest.fn()
        })
    }),
    controllerEvents: ({
        quiet: 'quiet',
    })

}));

describe('Domain Selector Tests', () => {
    var domainSelector;
    var currentDomain;
    var currentTimestamp;

    beforeEach(async () => {
        controller.controllers.currentDomain.setValue = (newDomain) => currentDomain = newDomain;
        controller.controllers.currentTimestamp.setValue = (newTimestamp) => currentTimestamp = newTimestamp;
        domainSelector = await document.body.appendChild(new DomainSelector());
    });

    test('Tests setUpForDomain', () => {
        domainSelector.setUpForDomain(1);

        expect(simVars.simVars.sortedTimestamps).toEqual(['2020']);
        expect(currentDomain).toEqual(1);
    });

    test('Tests calling setUpForDomain twice', () => {
        domainSelector.setUpForDomain(1);
        domainSelector.setUpForDomain(2);

        expect(simVars.simVars.sortedTimestamps).toEqual(['2020', '2021']);
        expect(currentDomain).toEqual(2);
    });

    test('Changing domain should change currentTimestamp when it doesn\'t exist in new domain', () => {
        domainSelector.setUpForDomain(2);
        controller.controllers.currentTimestamp.getValue = () => '2021';

        domainSelector.setUpForDomain(3);
        expect(currentTimestamp).toEqual('2021');

        controller.controllers.currentTimestamp.getValue = () => '2021.5';
        currentTimestamp = '2021.5';
        domainSelector.setUpForDomain(2);
        expect(currentTimestamp).toEqual('2021');
    });

    test('Changing domain should preserve currentTimestamp', () => {
        domainSelector.setUpForDomain(2);
        controller.controllers.currentTimestamp.getValue = () => '2021';

        domainSelector.setUpForDomain(3);
        expect(currentTimestamp).toEqual('2021');

        controller.controllers.currentTimestamp.getValue = () => '2020';
        domainSelector.setUpForDomain(2);
        expect(currentTimestamp).toEqual('2020');
    });
});