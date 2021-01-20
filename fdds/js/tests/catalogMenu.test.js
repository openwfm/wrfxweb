const {CatalogMenu} = require('../components/CatalogMenu/catalogMenu');
const services = require('../services.js');

const {L} = require("../leaflet/leaflet.js");
jest.mock("../leaflet/leaflet.js");

const {CatalogItem} = require('../components/CatalogMenu/catalogItem');
jest.mock('../components/CatalogMenu/catalogItem')

const catalogItemConstructor = (catEntry) => {
    const span = document.createElement('span');
    span.innerHTML = catEntry.description;
    return span;
}
CatalogItem.mockImplementation((catEntry, navJobId) => catalogItemConstructor(catEntry));

describe('fetching data for catalogMenu', () => {
    jest.spyOn(services, 'getCatalogEntries');
    services.getCatalogEntries.mockImplementation(() => {
        return {1: {job_id: 1, description: "mocked Fire"}, 
                2: {job_id: 2, description: "mocked GACC"}, 
                3: {job_id: 3, description: "mocked SAT"}};
    });

    var catalogMenu;
    beforeEach(async () => {
        catalogMenu = await document.body.appendChild(new CatalogMenu());
        return catalogMenu;
    });

    // test('List of Fire simulations is built properly', () => {
    //     const firesList = catalogMenu.firesList;
    //     expect(firesList.length).toEqual(1);
    //     expect(firesList[0].job_id).toEqual(1);
    // });

    // test('List of GACC simulations is built properly', () => {
    //     const fuelMoistureList = catalogMenu.fuelMoistureList;
    //     expect(fuelMoistureList.length).toEqual(1);
    //     expect(fuelMoistureList[0].job_id).toEqual(2);
    // });

    // test('List of SAT simulations is built properly', () => {
    //     const satelliteList = catalogMenu.satelliteList;
    //     expect(satelliteList.length).toEqual(1);
    //     expect(satelliteList[0].job_id).toEqual(3);
    // });

    test('DOM should render Fire simulation', () => {
        const check = document.querySelector('catalog-menu');
        console.log(check.innerHTML);
    });
});