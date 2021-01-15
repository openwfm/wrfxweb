const {CatalogMenu} = require('../components/CatalogMenu/catalogMenu');

const {L} = require("../leaflet/leaflet.js");
jest.mock("../leaflet/leaflet.js");

test('catalogMenu initial test', () => {
    // let catalogMenu = new CatalogMenu();
    document.body.innerHTML = "<catalog-menu></catalog-menu>";
    let catalogMenu = document.querySelector("catalog-menu")
    expect(catalogMenu.firesList.length).toEqual(3);
    // catalogMenu.sortBy("description");
});