import createCallbackStore from '../lib/createCallbackStore.js';
import stringToScope from '../lib/stringToScope.js';
import stringToArgs from '../lib/stringToArgs.js';
import argsToString from '../lib/argsToString.js';

async function scopedEval (context, expr) {
  const evaluator = Function.apply(null, [
    ...Object.keys(context),
    `return (async function sandbox () {${expr} })()`
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

        port.postMessage(['return', { id, args: argsToString([result], callbacks.add, run) }]);
      } catch (error) {
        try {
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
          ].slice(0, -1).join('\n');
          port.postMessage(['error', { id: errorId, args: argsToString([stack || error.message], callbacks.add, run) }]);
        } catch (error2) {
          port.postMessage(['error', { id: errorId, args: argsToString([error.message], callbacks.add, run) }]);
        }
      }
    }

    if (action === 'callback') {
      const parsedArgs = stringToArgs(args, callbacks.add, run);

      const fn = callbacks.get(id);
      if (!fn) {
        return;
      }
      const result = await fn(...parsedArgs);
      port.postMessage(['return', { id: resolve, args: argsToString([result], callbacks.add, run) }]);
    }
  };
});
