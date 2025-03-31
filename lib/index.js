import createCallbackStore from './createCallbackStore.js';
import builtinWorker from './builtinWorker.html.js';
import createSuperJSON from './createSuperJSON.js';

const instances = {
  count: 0
};
function createWorkerboxInstance (url, onMessage) {
  instances.count = instances.count + 1;
  const channel = new MessageChannel();
  const iframe = document.createElement('iframe');
  iframe.sandbox = 'allow-scripts';
  iframe.id = `workerBox-${instances.count}`;
  iframe.style =
    'position: fixed; height: 0; width: 0; opacity: 0; top: -100px;';
  if (url) {
    iframe.src = url;
  } else {
    iframe.srcdoc = url || builtinWorker;
  }
  document.body.appendChild(iframe);
  channel.port1.onmessage = onMessage;

  return new Promise(resolve => {
    iframe.addEventListener('load', () => {
      iframe.contentWindow.postMessage('OK', '*', [channel.port2]);
      resolve({
        postMessage: message => channel.port1.postMessage(message),
        destroy: () => iframe.remove()
      });
    });
  });
}

export async function createWorkerBox (options) {
  options = {
    serverUrl: null,
    appendVersion: true,
    ...options
  };

  if (options.serverUrl && options.serverUrl.slice(-1) === '/') {
    options.serverUrl = options.serverUrl.slice(0, -1);
  }

  if (options.serverUrl && options.appendVersion) {
    options.serverUrl = options.serverUrl + '/v6.4.5/';
  }

  options.serverUrl = options.serverUrl && (new URL(options.serverUrl)).href;

  const callbacks = createCallbackStore();
  const run = (id, args) =>
    new Promise((resolve, reject) => {
      instance.postMessage(['callback', {
        id, args, resolve: callbacks.add(resolve), reject: callbacks.add(reject)
      }]);
    });
  const superjson = createSuperJSON(callbacks.add, run);

  const instance = await createWorkerboxInstance(options.serverUrl, async message => {
    const [action, { id, args, resolve, reject }] = message.data;

    const parsedArgs = superjson.parse(args);

    if (action === 'error') {
      callbacks.get(id)?.(new Error(parsedArgs[0]));
      return;
    }

    if (action === 'return') {
      callbacks.get(id)?.(parsedArgs[0]);
      return;
    }

    const fn = callbacks.get(id);
    if (!fn) {
      return;
    }

    try {
      const result = await fn(...parsedArgs);
      instance.postMessage(['callback', { id: resolve, args: superjson.stringify([result]) }]);
    } catch (error) {
      instance.postMessage(['callback', { id: reject, args: superjson.stringify([error.message]) }]);
    }
  });

  return {
    run: async (code, originalScope) => {
      return new Promise((resolve, reject) => {
        const id = callbacks.add(resolve);
        const errorId = callbacks.add(reject);
        const scope = superjson.stringify(originalScope || {});
        instance.postMessage(['execute', { id, errorId, code, scope }]);
      });
    },
    destroy: () => instance.destroy(),
    options
  };
}

export default createWorkerBox;
