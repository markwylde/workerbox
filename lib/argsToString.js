import encodeArg from './encodeArg.js';

function argsToString (args, addCallback, runCallback) {
  return JSON.stringify(encodeArg(args, addCallback, runCallback));
}

export default argsToString;
