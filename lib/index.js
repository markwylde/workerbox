let workerBoxCount = 0;

function createWorkerBox (scriptUrl) {
  if (scriptUrl.slice(-1) === '/') {
    scriptUrl = scriptUrl.slice(0, -1);
  }

  scriptUrl = scriptUrl + '/v2.0.0/';
  try {
    scriptUrl = new URL(scriptUrl);
  } catch (error) {
    console.error(error);
    throw new Error([
      'createWorkerBox must be given a remote sandbox server to isolate unsafe code.',
      'a free hosted version is available at https://workerbox.net/'
    ].join('\n'));
  }

  const subdomain = [...Array(30)].map(() => Math.random().toString(36)[2]).join('');
  scriptUrl.host = `${subdomain}.${scriptUrl.host}`

  workerBoxCount = workerBoxCount + 1;
  return new Promise(resolve => {
    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-scripts allow-same-origin';
    iframe.id = `workerBox${workerBoxCount}`;
    iframe.style = 'position: fixed; height: 0; width: 0; opacity: 0; top: -100px;';
    iframe.src = scriptUrl.href;
    document.body.appendChild(iframe);

    const worker = document.getElementById(`workerBox${workerBoxCount}`).contentWindow;

    const promises = {};
    window.addEventListener('message', (event) => {
      if (event.data.ready) {
        let messageNumber = 0;
        resolve(code => {
          messageNumber = messageNumber + 1;
          const currentMessageNumber = messageNumber;

          worker.postMessage({
            messageNumber: currentMessageNumber,
            code
          }, '*');

          return new Promise((resolve, reject) => {
            promises[currentMessageNumber] = { resolve, reject };
          });
        });
        return;
      }

      const { messageNumber, error, result } = event.data;
      if (error) {
        promises[messageNumber].reject(error);
        return;
      }
      promises[messageNumber].resolve(result);
    });
  });
}

export default createWorkerBox;
