'use strict';
import { getConfigurations } from './services.js';

export var CLIENT_WIDTH = document.body.clientWidth;
export var IS_MOBILE = CLIENT_WIDTH < 769; 
// export var ELEMENT_FOCUSED = false;

window.onload = () => {
    const copyLink = document.querySelector('#copyLink');
    copyLink.onclick = () => {
        let input = document.body.appendChild(document.createElement("input"));
        input.value = window.location.href;
        input.focus();
        input.select();
        document.execCommand('copy');
        input.parentNode.removeChild(input);
        console.log('URL Copied: ' + window.location);
        alert('URL Copied: ' + window.location);
    }

    const splash = document.querySelector('#splash-screen');
    setTimeout(() => {
        splash.classList.add('hidden');
    }, 500);
}

window.addEventListener('resize', () => {
    CLIENT_WIDTH = document.body.clientWidth;
    IS_MOBILE = CLIENT_WIDTH < 769;
});

export const configData = (async function getConfigData() {
    let configData = await getConfigurations();

    document.title = configData.organization;
    if (configData.flags) {
        const simulationFlags = document.querySelector('#simulation-flags');
        let flags = configData.flags;
        flags.map(flag => {
            let spanElement = document.createElement('span');
            spanElement.className = 'displayTest';
            spanElement.innerText = flag;
            simulationFlags.appendChild(spanElement);
        });
    }
    return configData;
})();