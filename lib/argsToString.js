import scopeToString from './scopeToString.js';

function argsToString (args, addCallback, runCallback) {
  const newArgs = [];
  for (const arg of args) {
    if (typeof arg === 'function') {
      newArgs.push(['callback', addCallback(arg)]);
    } else if (typeof arg === 'object') {
      newArgs.push(['object', scopeToString(arg, addCallback, runCallback)]);
    } else {
      newArgs.push(['literal', arg]);
    }
  }
  return JSON.stringify(newArgs);
}

export default argsToString;
