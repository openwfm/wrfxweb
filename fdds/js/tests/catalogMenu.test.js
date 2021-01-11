const CatalogMenu = require('../components/CatalogMenu/catalogMenu');

test('catalogMenu initial test', () => {
    let catalogMenu = new CatalogMenu();
    catalogMenu.sortBy("description");
    expect(1).toEqual(1);
});