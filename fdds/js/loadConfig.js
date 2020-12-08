import configData from '../../etc/conf.js';

window.loadConfig = () => {
    if (configData.organization) {
        let organization = configData.organization;
        if (!organization.includes("SJSU")) {
            map.panTo([39.7392, -104.9903]);
        }
        document.title = organization;
        window.organization = organization;
    }

    if (configData.flags) {
        let flags = configData.flags;
        const simulationFlags = document.querySelector("#simulation-flags");
        flags.map(flag => {
            var spanElement = document.createElement("span");
            spanElement.className = "displayTest";
            spanElement.innerText = flag;
            simulationFlags.appendChild(spanElement);
        });
    }
}