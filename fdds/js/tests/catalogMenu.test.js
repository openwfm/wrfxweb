const {CatalogMenu} = require('../components/CatalogMenu/catalogMenu');
const services = require('../services.js');

const {L} = require("../leaflet/leaflet.js");
jest.mock("../leaflet/leaflet.js");

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

    test('catalogMenu initial test', () => {
        expect(catalogMenu.firesList.length).toEqual(1);
    });
});