import encodeArg from './encodeArg.js';

function scopeToString (scope, addCallback, runCallback) {
  return JSON.stringify(encodeArg(scope || {}, addCallback, runCallback));
}

export default scopeToString;
