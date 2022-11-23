import decodeArg from './decodeArg.js';

function stringToArgs (args, addCallback, runCallback) {
  return decodeArg(JSON.parse(args), addCallback, runCallback);
}

export default stringToArgs;
