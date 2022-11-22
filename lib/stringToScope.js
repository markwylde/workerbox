import argsToString from './argsToString.js';

function stringToScope (object, addCallback, runCallback) {
  object = JSON.parse(object);
  const newObject = {};
  for (const key in object) {
    if (object[key][0] === 'callback') {
      const fn = (...args) => {
        return runCallback(
          object[key][1],
          argsToString(args, addCallback)
        );
      };
      newObject[key] = fn;
    } else if (object[key][0] === 'object') {
      newObject[key] = stringToScope(object[key][1], addCallback, runCallback);
    } else {
      newObject[key] = object[key][1];
    }
  }

  return newObject;
}

export default stringToScope;
