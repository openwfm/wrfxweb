'use strict';

self.addEventListener('message', async event => {
    const imageInfo = event.data;

    let imageURL = imageInfo.imageURL;
    const response = await fetch(imageURL);
    const blob = await response.blob();
    imageInfo.blob = blob;
    
    postMessage(imageInfo);
});