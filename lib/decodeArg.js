import argsToString from './argsToString.js';

function decodeArg (arg, addCallback, runCallback) {
  if (arg[0] === 'callback') {
    return (...args) => runCallback(
      arg[1],
      argsToString(args, addCallback, runCallback)
    );
  } else if (arg[0] === 'array') {
    return arg[1].map(arg => decodeArg(arg, addCallback, runCallback));
  } else if (arg[0] === 'object') {
    const decodedArg = {};
    for (const key in arg[1]) {
      decodedArg[key] = decodeArg(arg[1][key], addCallback, runCallback);
    }
    return decodedArg;
  } else if (arg[0] === 'literal') {
    return arg[1];
  } else {
    throw Error(`Unexpected arg type: ${arg[0]}`);
  }
}
export default decodeArg;
