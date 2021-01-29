const {DomainSelector} = require("../components/domainSelector");

const controllers = require("../components/Controller.js");
jest.mock('../components/Controller.js', () => ({
    domainInstance: ({
        subscribe: jest.fn()
    }),
    currentDomain: ({
        getValue: jest.fn(),
        setValue: jest.fn()
    }),
    sorted_timestamps: ({
        getValue: jest.fn(),
        setValue: jest.fn()
    }),
    current_timestamp: ({
        getValue: jest.fn(),
        setValue: jest.fn()
    }),
    rasters: ({
        getValue: jest.fn(),
        setValue: jest.fn()
    }),
}));

describe('Domain Selector Tests', () => {
    var domainSelector;

    beforeEach(async () => {
        domainSelector = await document.body.append(new DomainSelector());
    });

    test('Setting up tests', () => {
    });
});