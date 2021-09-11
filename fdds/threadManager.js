export class ThreadManager {
    constructor(updateCallback) {
        this.updateCallback = updateCallback;
        this.N_WORKERS = 4;
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
            const batch = imageData.batch;

            this.updateCallback(batch);
        });

        worker.postMessage({
            loadFirst: loadFirst,
            loadLater: loadLater
        })

        return worker;
    }

    cancelLoad() {
        for (var worker of this.workers) {
            worker.terminate();
        }
        this.workers = [];
    } 
}