'use strict';
const MAX_BATCH_SIZE = 100;
const TIMEOUT_MS = 0;

async function loadImagesInBatches(imageIndex=0, batchSize, imageInfos, postMessage) {
    let batchLimit = Math.min(imageIndex + batchSize, imageInfos.length - 1);
    for (imageIndex; imageIndex <= batchLimit; imageIndex++) {
        let imageInfo = imageInfos[imageIndex];
        var imageURL = imageInfo.imageURL;
        const response = await fetch(imageURL);
        const blob = await response.blob();
        imageInfo.blob = blob;

        postMessage(imageInfo);
    }
    if (imageIndex < imageInfos.length) {
        setTimeout(loadImagesInBatches, TIMEOUT_MS, imageIndex, batchSize, imageInfos, postMessage);
    }
}

self.addEventListener('message', async event => {
    const layerData = event.data;
    var loadFirst = layerData.loadFirst;
    var loadLater = layerData.loadLater;
    var framesToLoad = loadFirst.length + loadLater.length;
    var totalLoaded = 0;

    var batch = [];
    var frameThreshold = Math.ceil(framesToLoad / 100);
    const postMessage = async (imageInfo) => {
        batch.push(imageInfo);
        if (batch.length >= frameThreshold || batch.length == (framesToLoad - totalLoaded)) {
            self.postMessage({
                batch: batch
            });
            totalLoaded += batch.length;
            batch = [];
        }
    }

    var batchSize = Math.min(frameThreshold, MAX_BATCH_SIZE);
    loadImagesInBatches(0, batchSize, loadFirst, postMessage);
    loadImagesInBatches(0, batchSize, loadLater, postMessage);
});