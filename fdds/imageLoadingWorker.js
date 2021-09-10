'use strict';

self.addEventListener('message', async event => {
    const urlData = event.data;
    var imageURL = urlData.imageURL;
    var timeStamp = urlData.timeStamp;
    var layerName = urlData.layerName;
    var layerDomain = urlData.layerDomain;
    var colorbar = urlData.colorbar;

    const response = await fetch(imageURL);
    const blob = await response.blob();
    var objectURL = null;
    if (blob.size > 0) {
        objectURL = URL.createObjectURL(blob);
    }
    self.postMessage({
        imageURL: imageURL, 
        objectURL: objectURL,
        timeStamp: timeStamp,
        layerName: layerName,
        layerDomain: layerDomain,
        colorbar: colorbar
    });
});