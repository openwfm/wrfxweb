'use strict';
const MAX_BATCH_SIZE = 20;
const TIMEOUT_MS = 75;

async function loadImagesInBatches(imageIndex=0, batchSize, imageInfos, worker) {
    let batchLimit = Math.min(imageIndex + batchSize, imageInfos.length - 1);
    for (imageIndex; imageIndex <= batchLimit; imageIndex++) {
    // for (var imageInfo of imageInfos) {
        let imageInfo = imageInfos[imageIndex];
        worker.postMessage(imageInfo);
    }
    if (imageIndex < imageInfos.length - 1) {
        setTimeout(loadImagesInBatches, TIMEOUT_MS, imageIndex, batchSize, imageInfos, worker);
    }
}

self.addEventListener('message', async event => {
    var worker = new Worker('imageLoadingWorker.js');
    
    const layerData = event.data;
    var loadFirst = layerData.loadFirst;
    var loadLater = layerData.loadLater;
    var framesToLoad = loadFirst.length + loadLater.length;
    var totalLoaded = 0;

    var batch = [];
    var frameThreshold = Math.ceil(framesToLoad / 20);
    const postMessage = async () => {
        if (batch.length >= frameThreshold || batch.length == (framesToLoad - totalLoaded)) {
            self.postMessage({
                batch: batch
            });
            totalLoaded += batch.length;
            batch = [];
        }
    }

    worker.addEventListener('message', async imageWorkerEvent => {
        const imageData = imageWorkerEvent.data;

        batch.push(imageData);
        await postMessage();
    });

    var batchSize = Math.min(frameThreshold, MAX_BATCH_SIZE);
    loadImagesInBatches(0, batchSize, loadFirst, worker);
    loadImagesInBatches(0, batchSize, loadLater, worker);
});