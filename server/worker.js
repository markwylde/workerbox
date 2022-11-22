import createCallbackStore from '../lib/createCallbackStore.js';
import stringToScope from '../lib/stringToScope.js';
import stringToArgs from '../lib/stringToArgs.js';
import argsToString from '../lib/argsToString.js';

function scopedEval (context, expr) {
  const evaluator = Function.apply(null, [
    ...Object.keys(context),
    `return (async function () {${expr} })()`
  ]);
  return evaluator.apply(null, [...Object.values(context)]);
}

self.addEventListener('message', async (event) => {
  const port = event.ports[0];

  const callbacks = createCallbackStore();
  const run = (id, args) =>
    new Promise(resolve => {
      port.postMessage(['callback', { id, args, resolve: callbacks.add(resolve) }]);
    });

  port.onmessage = async event => {
    const [action, message] = event.data;
    const { id, errorId, code, scope, args, resolve } = message;

    if (action === 'execute') {
      const parsedScope = stringToScope(scope, callbacks.add, run);

      try {
        const result = await scopedEval(parsedScope, code);

        port.postMessage(['return', { id, args: argsToString([result]) }]);
      } catch (error) {
        port.postMessage(['error', { id: errorId, args: argsToString([error.message]) }]);
      }
    }

    if (action === 'callback') {
      const parsedArgs = stringToArgs(args, callbacks.add, run);

      const fn = callbacks.get(id);
      if (!fn) {
        return;
      }
      const result = await fn(...parsedArgs);
      port.postMessage(['return', { id: resolve, args: argsToString([result]) }]);
    }
  };
});
