function encodeArg (arg, addCallback, runCallback) {
  if (typeof arg === 'function') {
    return ['callback', addCallback(arg)];
  } else if (arg instanceof Array) {
    return ['array', arg.map(arg => encodeArg(arg, addCallback, runCallback))];
  } else if (typeof arg === 'object' && arg !== null) {
    const newArg = {};
    for (const key in arg) {
      newArg[key] = encodeArg(arg[key], addCallback, runCallback);
    }
    return ['object', newArg];
  } else {
    return ['literal', arg];
  }
}
export default encodeArg;
