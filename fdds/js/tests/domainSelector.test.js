const {DomainSelector} = require("../components/domainSelector");

const controllers = require("../components/Controller.js");
jest.mock('../components/Controller.js', () => ({
    domainInstance: ({
        subscribe: jest.fn(),
        getValue: () => [1, 2]
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
        getValue: () => ({
            1: {
                "2020": {"raster": {}}
            },
            2: {
                "2020": {"raster": {}},
                "2021": {"raster": {}}
            }
        })
    }),
}));

describe('Domain Selector Tests', () => {
    var domainSelector;
    var sorted_timestamps;
    var current_timestamp;
    var currentDomain;

    beforeEach(async () => {
        controllers.sorted_timestamps.setValue = (newSortedTimestamps) => sorted_timestamps = newSortedTimestamps;
        controllers.sorted_timestamps.getValue = () => sorted_timestamps;
        controllers.current_timestamp.setValue = (newTimestamp) => current_timestamp = newTimestamp;
        controllers.currentDomain.setValue = (newDomain) => currentDomain = newDomain;
        domainSelector = await document.body.appendChild(new DomainSelector());
    });

    test('Tests setUpForDomain', () => {
        domainSelector.setUpForDomain(1);
        expect(sorted_timestamps).toEqual(["2020"]);
        expect(current_timestamp).toEqual("2020");
        expect(currentDomain).toEqual(1);
    });

    test('Tests calling setUpForDomain twice', () => {
        domainSelector.setUpForDomain(1);
        domainSelector.setUpForDomain(2);
        expect(sorted_timestamps).toEqual(["2020", "2021"]);
        expect(current_timestamp).toEqual("2020");
        expect(currentDomain).toEqual(2);
    });
});