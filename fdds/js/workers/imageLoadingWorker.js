self.addEventListener('message', async event => {
    const imageURL = event.data;
    const response = await fetch(imageURL);
    const fileBlob = await response.blob();
    // var returnMessage = message.data + ' message received';
    // self.postMessage(returnMessage);
    self.close();
});