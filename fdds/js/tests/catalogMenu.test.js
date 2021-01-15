const {CatalogMenu} = require('../components/CatalogMenu/catalogMenu');
const services = require('../services.js');

const {L} = require("../leaflet/leaflet.js");
jest.mock("../leaflet/leaflet.js");

test('catalogMenu initial test', () => {
    jest.spyOn(services, 'getCatalogEntries');
    services.getCatalogEntries.mockImplementation(() => {
        return {"1": {job_id: 1, description: "mocked Fire"}}
    });
    document.body.innerHTML = "<catalog-menu></catalog-menu>";
    const catalogMenu = document.querySelector("catalog-menu")
    console.log(catalogMenu);
    expect(catalogMenu.firesList.length).toEqual(1);
});