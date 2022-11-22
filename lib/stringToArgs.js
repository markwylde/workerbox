import argsToString from './argsToString.js';
import stringToScope from './stringToScope.js';

function stringToArgs (args, addCallback, runCallback) {
  args = JSON.parse(args);

  const newArgs = [];
  for (const arg of args) {
    if (arg[0] === 'callback') {
      const fn = (...args) => runCallback(
        arg[1],
        argsToString(args, addCallback)
      );
      newArgs.push(fn);
    } else if (arg[0] === 'object') {
      newArgs.push(stringToScope(arg[1], addCallback, runCallback));
    } else {
      newArgs.push(arg[1]);
    }
  }

  return newArgs;
}

export default stringToArgs;
