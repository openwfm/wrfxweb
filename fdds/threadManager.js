'use strict';

const MAX_BATCH_SIZE = 10;
const TIMEOUT_MS = 80;

async function loadImagesInBatches(imageIndex=0, batchSize, imageInfos, worker) {
    let batchLimit = Math.min(imageIndex + batchSize, imageInfos.length - 1);
    for (imageIndex; imageIndex <= batchLimit; imageIndex++) {
        var imageInfo = imageInfos[imageIndex];
        worker.postMessage(imageInfo);
    }
    if (imageIndex < imageInfos.length) {
        setTimeout(loadImagesInBatches, TIMEOUT_MS, imageIndex, batchSize, imageInfos, worker);
    }
}

export class ThreadManager {
    constructor(updateCallback) {
        this.updateCallback = updateCallback;
        this.N_WORKERS = 2;
        if(navigator.userAgent.indexOf("Firefox") != -1 ) {
            this.N_WORKERS = 1;
        }
        this.workers = [];
    }

    loadImages(loadFirst, loadLater) {
        var firstSize = Math.ceil(loadFirst.length / this.N_WORKERS);
        var laterSize = Math.ceil(loadLater.length / this.N_WORKERS);
        this.cancelLoad();
        for (var i = 0; i < this.N_WORKERS; i++) {
            var iFirst = i * firstSize;
            var jFirst = Math.min((i+1) * firstSize, loadFirst.length);
            var firstBatch = loadFirst.slice(iFirst, jFirst);

            var iLater = i * laterSize;
            var jLater = Math.min((i+1) * laterSize, loadLater.length);
            var laterBatch = loadLater.slice(iLater, jLater);

            var worker = this.startThread(firstBatch, laterBatch);
            this.workers.push(worker);
        }
    }

    startThread(loadFirst, loadLater) {
        var worker = new Worker('imageLoadingWorker.js');
        worker.addEventListener('message', async event => {
            const imageData = event.data;
            this.updateCallback(imageData);
        });

        var batchSize = Math.min(Math.ceil(loadFirst.length / 20), MAX_BATCH_SIZE);
        loadImagesInBatches(0, batchSize, loadFirst, worker);
        loadImagesInBatches(0, batchSize, loadLater, worker);

        return worker;
    }

    cancelLoad() {
        for (var worker of this.workers) {
            worker.terminate();
        }
        this.workers = [];
    } 
}