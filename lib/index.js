let workerBoxCount = 0;
let incrementor = 0;
const generateUniqueId = () => {
  incrementor = incrementor + 1;
  return 1 + '_' + Array(20)
    .fill('!@#$%^&*()_+-=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
    .map(function (x) { return x[Math.floor(Math.random() * x.length)]; }).join('');
};

export function createWorkerBox (scriptUrl, options) {
  options = {
    appendVersion: true,
    randomiseSubdomain: false,
    ...options
  };

  if (scriptUrl.slice(-1) === '/') {
    scriptUrl = scriptUrl.slice(0, -1);
  }

  if (options.appendVersion) {
    scriptUrl = scriptUrl + '/v3.5.0/';
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

  if (options.randomiseSubdomain) {
    const subdomain = [...Array(30)]
      .map(() => Math.random().toString(36)[2])
      .join('');
    scriptUrl.host = `${subdomain}.${scriptUrl.host}`;
  }

  workerBoxCount = workerBoxCount + 1;
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-scripts allow-same-origin';
    iframe.id = `workerBox${workerBoxCount}`;
    iframe.style =
      'position: fixed; height: 0; width: 0; opacity: 0; top: -100px;';
    iframe.src = scriptUrl.href;
    document.body.appendChild(iframe);

    const worker = document.getElementById(
      `workerBox${workerBoxCount}`
    ).contentWindow;

    const promises = {};
    const callbacks = {};

    function prepareArgs (args) {
      const newArgs = [];
      for (const arg of args) {
        if (typeof arg === 'function') {
          const callbackId = generateUniqueId();
          callbacks[callbackId] = arg;
          newArgs.push(['callback', callbackId]);
        } else if (typeof arg === 'object') {
          newArgs.push(['object', prepareArgs(arg)]);
        } else {
          newArgs.push(['literal', arg]);
        }
      }
      return newArgs;
    }
    window.addEventListener('message', async (event) => {
      if (event.data.ready) {
        const run = (code, scope) => {
          const messageId = generateUniqueId();
          function prepareScope (scope) {
            const newScope = {};
            for (const key in scope) {
              if (typeof scope[key] === 'function') {
                newScope[key] = ['function', key];
              } else if (typeof scope[key] === 'object') {
                newScope[key] = ['object', prepareScope(scope[key])];
              } else {
                newScope[key] = ['literal', scope[key]];
              }
            }
            return newScope;
          }

          function parseArgs (args) {
            const newArgs = [];
            for (const arg of args) {
              if (arg[0] === 'callback') {
                newArgs.push((...rawArgs) => {
                  return new Promise((resolve) => {
                    const args = prepareArgs([...rawArgs, resolve]);
                    worker.postMessage(
                      {
                        messageNumber: messageId,
                        callbackKey: arg[1],
                        callbackArgs: args
                      },
                      event.origin
                    );
                  });
                });
              } else if (arg[0] === 'object') {
                newArgs.push(parseArgs(arg[1]));
              } else {
                newArgs.push(arg[1]);
              }
            }
            return newArgs;
          }

          const callFunction = async (key, args) => {
            const [resolve] = parseArgs(args).slice(-1);
            const result = await scope[key]?.call(
              null,
              ...parseArgs(args).slice(0, -1)
            );
            resolve(result);
          };

          worker.postMessage(
            {
              messageNumber: messageId,
              code,
              scope: prepareScope(scope)
            },
            event.origin
          );

          return new Promise((resolve, reject) => {
            promises[messageId] = { resolve, reject, callFunction };
          });
        };

        run.destroy = () => {
          iframe.remove();
        };

        resolve(run);
        return;
      }

      const { messageNumber, error, result } = event.data;
      if (event.data.functionKey) {
        promises[messageNumber]?.callFunction(
          event.data.functionKey,
          event.data.functionArgs
        );
        return;
      }

      if (event.data.callbackKey) {
        callbacks[event.data.callbackKey]?.(
          event.data.callbackArgs[0]
        );
        return;
      }

      if (error) {
        promises[messageNumber]?.reject(error);
        return;
      }
      promises[messageNumber]?.resolve(result);
    });
  });
}

export default createWorkerBox;
