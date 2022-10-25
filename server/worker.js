self.addEventListener('message', (workerboxEvent) => {
  self.workerboxEvent = workerboxEvent;
  workerboxEvent = undefined;

  try {
    const result = eval(self.workerboxEvent.data.code);

    self.postMessage({
      messageNumber: self.workerboxEvent.data.messageNumber,
      origin: self.workerboxEvent.data.origin,
      result
    });
  } catch (error) {
    self.postMessage({
      messageNumber: self.workerboxEvent.data.messageNumber,
      origin: self.workerboxEvent.data.origin,
      error
    });
  }
});
