self.addEventListener('message', (event) => {
  const { messageNumber, origin, code } = event.data;
  const result = eval(code);

  self.postMessage({ messageNumber, origin, result});
  self.close();
})
