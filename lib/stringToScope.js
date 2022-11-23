import decodeArg from './decodeArg.js';

function stringToScope (object, addCallback, runCallback) {
  return decodeArg(JSON.parse(object), addCallback, runCallback);  
}

export default stringToScope;
