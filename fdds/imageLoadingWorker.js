'use strict';

self.addEventListener('message', async event => {
    const urlData = event.data;
    var imageURL = urlData.imageURL;
    var timeStamp = urlData.timeStamp;
    var layerName = urlData.layerName;
    var layerDomain = urlData.layerDomain;

    const response = await fetch(imageURL);
    const blob = await response.blob();
    self.postMessage({
        imageURL: imageURL, 
        blob: blob,
        timeStamp: timeStamp,
        layerName: layerName,
        layerDomain: layerDomain,
    });
});