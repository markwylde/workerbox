import createCallbackStore from './createCallbackStore.js';
import scopeToString from './scopeToString.js';
import stringToArgs from './stringToArgs.js';
import argsToString from './argsToString.js';

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
  iframe.src = url;
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

export async function createWorkerBox (scriptUrl, options) {
  options = {
    appendVersion: true,
    ...options
  };

  if (scriptUrl.slice(-1) === '/') {
    scriptUrl = scriptUrl.slice(0, -1);
  }

  if (options.appendVersion) {
    scriptUrl = scriptUrl + '/v5.3.0/';
  }

  try {
    scriptUrl = new URL(scriptUrl);
  } catch (error) {
    console.error(error);
    throw new Error(
      [
        'createWorkerBox must be given a remote sandbox server to isolate unsafe code.',
        'a free hosted version is available at https://workerbox.net/'
      ].join('\n')
    );
  }

  const callbacks = createCallbackStore();

  const run = (id, args) =>
    new Promise((resolve, reject) => {
      instance.postMessage(['callback', {
        id, args, resolve: callbacks.add(resolve), reject: callbacks.add(reject)
      }]);
    });

  const instance = await createWorkerboxInstance(scriptUrl.href, async message => {
    const [action, { id, args, resolve, reject }] = message.data;

    const parsedArgs = stringToArgs(args, callbacks.add, run);

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
      instance.postMessage(['callback', { id: resolve, args: argsToString([result], callbacks.add, run) }]);
    } catch (error) {
      instance.postMessage(['callback', { id: reject, args: argsToString([error.message], callbacks.add, run) }]);
    }
  });

  return {
    run: async (code, originalScope) => {
      return new Promise((resolve, reject) => {
        const id = callbacks.add(resolve);
        const errorId = callbacks.add(reject);
        const scope = scopeToString(originalScope, callbacks.add, run);
        instance.postMessage(['execute', { id, errorId, code, scope }]);
      });
    },
    destroy: () => instance.destroy(),
    scriptUrl: scriptUrl.href
  };
}

export default createWorkerBox;
