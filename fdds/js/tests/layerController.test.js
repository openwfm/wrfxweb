const {LayerController} = require("../components/layerController");
const {L} = require("../leaflet/leaflet.js");
jest.mock("../leaflet/leaflet.js");

const controllers = require("../components/Controller.js");
jest.mock('../components/Controller.js', () => ({
    currentDomain: ({
        subscribe: () => {}
    }),
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

    test('Layer Controller should initially not be visible', () => {
        const container = document.querySelector("#layer-controller-container");
        console.log(getComputedStyle(container).getPropertyValue("display"));
        console.log(window.getComputedStyle(container).getPropertyValue("display"));
        expect(getComputedStyle(container).getPropertyValue("right")).toBe("none");
    });
});