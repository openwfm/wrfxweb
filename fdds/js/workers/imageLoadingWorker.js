self.addEventListener('message', async event => {
    const imageURL = event.data;
    const response = await fetch('/fdds/' + imageURL);
    const blob = await response.blob();
    self.postMessage({
        imageURL: imageURL, 
        blob: blob
    })
});