const {LayerController} = require("../components/layerController");
const {L} = require("../leaflet/leaflet.js");
jest.mock("../leaflet/leaflet.js");

describe('Setting up tests for layerController', () => {
    var layerController;

    beforeEach(async () => {
        layerController = await document.body.appendChild(new LayerController());
    });

    test('First test', () => {
        expect(true).toBe(true);
    });
});