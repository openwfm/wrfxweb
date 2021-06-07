'use strict';

self.addEventListener('message', async event => {
    const urlData = event.data;
    var imageURL = urlData.url;
    var timestamp = urlData.time;
    const response = await fetch(imageURL);
    const blob = await response.blob();
    self.postMessage({
        imageURL: imageURL, 
        blob: blob,
        timestamp: timestamp
    });
});