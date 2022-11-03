const callbacks = {};
let currentCallbackId = 0;

function prepareArgs (args) {
  const newArgs = [];
  for (const arg of args) {
    if (typeof arg === 'function') {
      currentCallbackId = currentCallbackId + 1;
      callbacks[currentCallbackId] = arg;
      newArgs.push(['callback', currentCallbackId]);
    } else if (typeof arg === 'object') {
      newArgs.push(['object', prepareArgs(arg)]);
    } else {
      newArgs.push(['literal', arg]);
    }
  }
  return newArgs;
}

function parseArgs (args) {
  const newArgs = [];
  for (const arg of args) {
    if (arg[0] === 'callback') {
      newArgs.push((...rawArgs) => {
        return new Promise(resolve => {
          const args = prepareArgs([...rawArgs, resolve]);
          self.postMessage({
            callbackKey: arg[1],
            callbackArgs: args
          }, '*');
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

self.addEventListener('message', async (workerboxEvent) => {
  if (workerboxEvent.data.callbackKey) {
    const result = await callbacks[workerboxEvent.data.callbackKey](...parseArgs(workerboxEvent.data.callbackArgs.slice(0, -1)));
    const [resolve] = workerboxEvent.data.callbackArgs.slice(-1);
    resolve && resolve(result);
    return;
  }

  try {
    function parseScope (scope) {
      const newScope = {};
      for (const key in scope) {
        if (scope[key][0] === 'function') {
          newScope[key] = (...rawArgs) => {
            return new Promise(resolve => {
              const args = prepareArgs([...rawArgs, resolve]);
              self.postMessage({
                messageNumber: workerboxEvent.data.messageNumber,
                functionKey: scope[key][1],
                functionArgs: args,
                origin: workerboxEvent.data.origin
              });
            });
          };
        } else if (scope[key][0] === 'object') {
          newScope[key] = parseScope(scope[key][1]);
        } else {
          newScope[key] = scope[key][1];
        }
      }
      return newScope;
    }

    function execute (code, scope) {
      return Function(`
        "use strict";
        Object.assign(self, arguments[0]);

        return (async function() {
          ${code}
        })();
      `)(scope);
    }

    const scope = parseScope(workerboxEvent.data.scope);
    const result = await execute(workerboxEvent.data.code, scope);

    self.postMessage({
      messageNumber: workerboxEvent.data.messageNumber,
      origin: workerboxEvent.data.origin,
      result
    });
  } catch (error) {
    self.postMessage({
      messageNumber: workerboxEvent.data.messageNumber,
      origin: workerboxEvent.data.origin,
      error
    });
  }
});
