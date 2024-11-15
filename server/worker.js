import createCallbackStore from '../lib/createCallbackStore.js';
import createSuperJSON from '../lib/createSuperJSON.js';

async function scopedEval (context, expr) {
  const evaluator = Function.apply(null, [
    ...Object.keys(context),
    `return (async function sandbox () {${expr} })()`
  ]);
  return evaluator.apply(null, [...Object.values(context)]);
}

const getStack = (error, slice) => {
  const lines = error.stack.split('\n');
  const stack = [
    lines[0],
    ...lines
      .filter(line => line.includes('(eval at scopedEval'))
      .map(line => {
        const splitted = line.split('(eval at scopedEval (');
        const [, mixedPosition] = line.split('<anonymous>');
        const [, lineNumber, charNumber] = mixedPosition.slice(0, -1).split(':');
        return `${splitted[0]}(<sandbox>:${lineNumber - 3}:${charNumber})`
      })
  ].slice(0, slice).join('\n');
  return stack;
}

self.addEventListener('message', async (event) => {
  const port = event.ports[0];

  const callbacks = createCallbackStore();
  const run = (id, args) =>
    new Promise(resolve => {
      port.postMessage(['callback', { id, args, resolve: callbacks.add(resolve) }]);
    });
  const superjson = createSuperJSON(callbacks.add, run);

  port.onmessage = async event => {
    const [action, message] = event.data;
    const { id, errorId, code, scope, args, resolve, reject } = message;

    if (action === 'execute') {
      const parsedScope = superjson.parse(scope);

      try {
        const result = await scopedEval(parsedScope, code);

        port.postMessage(['return', { id, args: superjson.stringify([result]) }]);
      } catch (error) {
        try {
          const stack = getStack(error, -1);
          port.postMessage(['error', { id: errorId, args: superjson.stringify([stack || error.message]) }]);
        } catch (error2) {
          port.postMessage(['error', { id: errorId, args: superjson.stringify([error.message]) }]);
        }
      }
    }

    if (action === 'callback') {
      const parsedArgs = superjson.parse(args);

      const fn = callbacks.get(id);
      if (!fn) {
        return;
      }
      try {
        const result = await fn(...parsedArgs);
        port.postMessage(['return', { id: resolve, args: superjson.stringify([result]) }]);
      } catch (error) {
        const stack = getStack(error);
        port.postMessage(['error', { id: reject, args: superjson.stringify([stack || error.message]) }]);
      }
    }
  };
});
