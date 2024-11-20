"use strict";

const MAX_BATCH_SIZE = 10;
const TIMEOUT_MS = 80;

async function loadImagesInBatches(
  imageIndex = 0,
  batchSize,
  imageInfos,
  worker,
) {
  let batchLimit = Math.min(imageIndex + batchSize, imageInfos.length - 1);
  for (imageIndex; imageIndex <= batchLimit; imageIndex++) {
    let imageInfo = imageInfos[imageIndex];
    worker.postMessage(imageInfo);
  }
  if (imageIndex < imageInfos.length) {
    setTimeout(
      loadImagesInBatches,
      TIMEOUT_MS,
      imageIndex,
      batchSize,
      imageInfos,
      worker,
    );
  }
}

export class ThreadManager {
  constructor(updateCallback) {
    this.updateCallback = updateCallback;
    this.N_WORKERS = 2;
    if (navigator.userAgent.indexOf("Firefox") != -1) {
      this.N_WORKERS = 1;
    }
    this.workers = [];
  }

  loadImages(loadFirst, loadLater) {
    let firstSize = Math.ceil(loadFirst.length / this.N_WORKERS);
    let laterSize = Math.ceil(loadLater.length / this.N_WORKERS);
    this.cancelCurrentLoad();
    for (let i = 0; i < this.N_WORKERS; i++) {
      let iFirst = i * firstSize;
      let jFirst = Math.min((i + 1) * firstSize, loadFirst.length);
      let firstBatch = loadFirst.slice(iFirst, jFirst);

      let iLater = i * laterSize;
      let jLater = Math.min((i + 1) * laterSize, loadLater.length);
      let laterBatch = loadLater.slice(iLater, jLater);

      let worker = this.startThread(firstBatch, laterBatch);
      this.workers.push(worker);
    }
  }

  startThread(loadFirst, loadLater) {
    let worker = new Worker("imageLoadingWorker.js");
    worker.addEventListener("message", async (event) => {
      const imageData = event.data;
      this.updateCallback(imageData);
    });

    let batchSize = Math.min(Math.ceil(loadFirst.length / 20), MAX_BATCH_SIZE);
    loadImagesInBatches(0, batchSize, loadFirst, worker);
    loadImagesInBatches(0, batchSize, loadLater, worker);

    return worker;
  }

  cancelCurrentLoad() {
    for (let worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
  }
}
