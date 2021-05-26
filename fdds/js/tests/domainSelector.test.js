const { DomainSelector } = require('../components/domainSelector');

const util = require('../util.js');
jest.mock('../util.js', () => ({
    simVars: ({
        sortedTimestamps: [],
        rasters: ({
            1: {
                "2020": {"raster": {}}
            },
            2: {
                "2020": {"raster": {}},
                "2021": {"raster": {}}
            } 
        })
    })
}));

const controller = require('../components/Controller.js');
jest.mock('../components/Controller.js', () => ({
    controllers: ({
        domainInstance: ({
            subscribe: jest.fn(),
            getValue: () => [1, 2]
        }),
        currentDomain: ({
            getValue: jest.fn(),
            setValue: jest.fn()
        }),
    })
}));

describe('Domain Selector Tests', () => {
    var domainSelector;
    var currentDomain;

    beforeEach(async () => {
        controller.controllers.currentDomain.setValue = (newDomain) => currentDomain = newDomain;
        domainSelector = await document.body.appendChild(new DomainSelector());
    });

    test('Tests setUpForDomain', () => {
        domainSelector.setUpForDomain(1);
        expect(util.simVars.sortedTimestamps).toEqual(["2020"]);
        expect(currentDomain).toEqual(1);
    });

    test('Tests calling setUpForDomain twice', () => {
        domainSelector.setUpForDomain(1);
        domainSelector.setUpForDomain(2);
        expect(util.simVars.sortedTimestamps).toEqual(["2020", "2021"]);
        expect(currentDomain).toEqual(2);
    });
});