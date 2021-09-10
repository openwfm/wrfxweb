'use strict';
function loadImages(imageInfos, worker) {
    for (var imageInfo of imageInfos) {
        worker.postMessage(imageInfo);
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

    loadImages(loadFirst, worker);
    loadImages(loadLater, worker);
});