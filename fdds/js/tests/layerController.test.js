const {LayerController} = require("../components/layerController");
const {L} = require("../leaflet/leaflet.js");
jest.mock("../leaflet/leaflet.js");

const controllers = require("../components/Controller.js");
jest.mock('../components/Controller.js', () => ({
    currentSimulation: ({
        getValue: () => "test",
        subscribe: () => {}
    })
}));

describe('Setting up tests for layerController', () => {
    var layerController;

    beforeEach(async () => {
        layerController = await document.body.appendChild(new LayerController());
    });

    test('First test', () => {
        expect(true).toBe(true);
    });
});